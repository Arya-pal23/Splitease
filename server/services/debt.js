const { db } = require('../db/schema');

/**
 * Calculates member net balances and pair-wise balances for a group.
 */
function getGroupBalances(groupId, currentUserId) {
  // Fetch members
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.username, u.avatar_color
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `).all(groupId);

  const memberMap = {};
  members.forEach(m => {
    memberMap[m.id] = { ...m, netBalance: 0, paid: 0, share: 0 };
  });

  // Fetch all expenses in group
  const expenses = db.prepare(`
    SELECT id, amount, paid_by FROM expenses WHERE group_id = ?
  `).all(groupId);

  // Pairwise net matrix: pairwise[u1][u2] = net amount u1 owes u2
  const pairwiseMap = {};
  members.forEach(m1 => {
    pairwiseMap[m1.id] = {};
    members.forEach(m2 => {
      pairwiseMap[m1.id][m2.id] = 0;
    });
  });

  expenses.forEach(exp => {
    const paidBy = exp.paid_by;
    if (memberMap[paidBy]) {
      memberMap[paidBy].paid += exp.amount;
    }

    const splits = db.prepare(`
      SELECT user_id, amount FROM expense_splits WHERE expense_id = ?
    `).all(exp.id);

    splits.forEach(split => {
      if (memberMap[split.user_id]) {
        memberMap[split.user_id].share += split.amount;
      }

      // If user_id is not the paidBy user, user_id owes paidBy for this split
      if (split.user_id !== paidBy) {
        if (pairwiseMap[split.user_id] && pairwiseMap[split.user_id][paidBy] !== undefined) {
          pairwiseMap[split.user_id][paidBy] += split.amount;
        }
      }
    });
  });

  // Factor in settlements
  const settlements = db.prepare(`
    SELECT from_user, to_user, amount FROM settlements WHERE group_id = ?
  `).all(groupId);

  settlements.forEach(s => {
    if (pairwiseMap[s.from_user] && pairwiseMap[s.from_user][s.to_user] !== undefined) {
      // Settlement reduces debt from_user owes to_user
      pairwiseMap[s.from_user][s.to_user] -= s.amount;
    }
  });

  // Calculate Net Balances
  // netBalance = totalPaid - totalShare + (settlements paid by me) - (settlements received by me)
  members.forEach(m => {
    const id = m.id;
    let net = memberMap[id].paid - memberMap[id].share;

    settlements.forEach(s => {
      if (s.from_user === id) net += s.amount;
      if (s.to_user === id) net -= s.amount;
    });

    memberMap[id].netBalance = Math.round(net * 100) / 100;
  });

  // Calculate pairwise simplified/net debts
  // For each pair (i, j), simplify pairwiseMap[i][j] vs pairwiseMap[j][i]
  const pairSummary = [];
  const processedPairs = new Set();

  members.forEach(m1 => {
    members.forEach(m2 => {
      if (m1.id === m2.id) return;
      const key = [m1.id, m2.id].sort().join('-');
      if (processedPairs.has(key)) return;
      processedPairs.add(key);

      const o1to2 = pairwiseMap[m1.id][m2.id] || 0;
      const o2to1 = pairwiseMap[m2.id][m1.id] || 0;
      const net = o1to2 - o2to1;

      if (net > 0) {
        pairSummary.push({
          fromUser: memberMap[m1.id],
          toUser: memberMap[m2.id],
          amount: Math.round(net * 100) / 100
        });
      } else if (net < 0) {
        pairSummary.push({
          fromUser: memberMap[m2.id],
          toUser: memberMap[m1.id],
          amount: Math.round(Math.abs(net) * 100) / 100
        });
      }
    });
  });

  // Calculate Minimum Debt Simplification
  const simplifiedDebts = simplifyDebts(Object.values(memberMap));

  return {
    members: Object.values(memberMap),
    pairSummary,
    simplifiedDebts
  };
}

/**
 * Greedy minimum transaction debt simplification algorithm.
 */
function simplifyDebts(members) {
  const creditors = [];
  const debtors = [];

  members.forEach(m => {
    const bal = m.netBalance;
    if (bal > 0.01) {
      creditors.push({ user: m, balance: bal });
    } else if (bal < -0.01) {
      debtors.push({ user: m, balance: Math.abs(bal) });
    }
  });

  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > 0.01) {
      transactions.push({
        fromUser: debtor.user,
        toUser: creditor.user,
        amount: Math.round(amount * 100) / 100
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance <= 0.01) i++;
    if (creditor.balance <= 0.01) j++;
  }

  return transactions;
}

/**
 * Get total overall balance metrics for a specific user across all their groups.
 */
function getUserDashboardSummary(userId) {
  // Get all groups user belongs to
  const groups = db.prepare(`
    SELECT g.id, g.name, g.description
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    WHERE gm.user_id = ?
  `).all(userId);

  let totalYouAreOwed = 0;
  let totalYouOwe = 0;
  const youAreOwedList = [];
  const youOweList = [];

  const groupDetails = groups.map(g => {
    const balances = getGroupBalances(g.id, userId);
    const userInGroup = balances.members.find(m => m.id === userId);
    const netBalance = userInGroup ? userInGroup.netBalance : 0;

    // Collect debts relative to current user in this group
    balances.simplifiedDebts.forEach(d => {
      if (d.toUser.id === userId) {
        totalYouAreOwed += d.amount;
        youAreOwedList.push({
          user: d.fromUser,
          amount: d.amount,
          groupName: g.name,
          groupId: g.id
        });
      } else if (d.fromUser.id === userId) {
        totalYouOwe += d.amount;
        youOweList.push({
          user: d.toUser,
          amount: d.amount,
          groupName: g.name,
          groupId: g.id
        });
      }
    });

    // Get last expense date
    const lastExp = db.prepare(`
      SELECT created_at FROM expenses WHERE group_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(g.id);

    return {
      id: g.id,
      name: g.name,
      description: g.description,
      memberCount: balances.members.length,
      userNetBalance: netBalance,
      lastExpenseDate: lastExp ? lastExp.created_at : null
    };
  });

  return {
    totalBalance: Math.round((totalYouAreOwed - totalYouOwe) * 100) / 100,
    youAreOwed: Math.round(totalYouAreOwed * 100) / 100,
    youOwe: Math.round(totalYouOwe * 100) / 100,
    youAreOwedList,
    youOweList,
    groups: groupDetails
  };
}

module.exports = {
  getGroupBalances,
  simplifyDebts,
  getUserDashboardSummary
};
