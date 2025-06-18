// src/components/provider/PayoutSettingsModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { PayoutSettingsModalProps, PayoutAccount } from '../../types.js';

const PayoutSettingsModal: React.FC<PayoutSettingsModalProps> = ({
  isOpen,
  onClose,
  payoutAccounts,
  payoutHistory,
  currentBalance,
  onAddAccount,
  onSetPrimaryAccount,
  onDeleteAccount,
  onRequestPayout,
}) => {
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [accountNickname, setAccountNickname] = useState('');
  const [mockBankName, setMockBankName] = useState('');
  const [mockAccountNumber, setMockAccountNumber] = useState(''); // For full number input, then take last 4
  const [payoutAmount, setPayoutAmount] = useState<number | string>('');
  const [selectedPayoutAccount, setSelectedPayoutAccount] = useState<string>(payoutAccounts.find(acc => acc.isPrimary)?.id || '');
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!mockBankName.trim() || !mockAccountNumber.trim()) {
      setFormError('Bank name and account number are required for mock setup.');
      return;
    }
    if (mockAccountNumber.length < 4) {
        setFormError('Mock account number must be at least 4 digits.');
        return;
    }

    onAddAccount({
      type: 'bank_account',
      accountNickname: accountNickname || `${mockBankName} (...${mockAccountNumber.slice(-4)})`,
      mockBankName,
      mockAccountNumberLast4: mockAccountNumber.slice(-4),
      mockRoutingNumberValid: true, // Assume valid for mock
    });
    setAccountNickname('');
    setMockBankName('');
    setMockAccountNumber('');
    setShowAddAccountForm(false);
  };
  
  const handleRequestPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = parseFloat(payoutAmount as string);
    if (isNaN(amount) || amount <= 0) {
        setFormError('Please enter a valid positive amount for payout.');
        return;
    }
    if (amount > currentBalance) {
        setFormError('Payout amount cannot exceed current balance.');
        return;
    }
    if (!selectedPayoutAccount) {
        setFormError('Please select a payout account.');
        return;
    }
    onRequestPayout(amount, selectedPayoutAccount);
    setPayoutAmount('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payout Settings & History" size="3xl">
      <div className="space-y-6 p-1">
        {/* Current Balance */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Current Balance</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${currentBalance.toFixed(2)}</p>
        </div>

        {/* Request Payout */}
        <form onSubmit={handleRequestPayoutSubmit} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow border border-gray-200 dark:border-gray-600 space-y-3">
          <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Request Payout</h3>
          {formError && payoutAmount && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Input
              label="Amount to Withdraw"
              name="payoutAmount"
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder={`Max $${currentBalance.toFixed(2)}`}
              min="0.01"
              step="0.01"
              required
            />
            <div>
                <label htmlFor="payoutAccountSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Account</label>
                <select
                    id="payoutAccountSelect"
                    value={selectedPayoutAccount}
                    onChange={(e) => setSelectedPayoutAccount(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                    required
                    disabled={payoutAccounts.length === 0}
                >
                    <option value="" disabled>{payoutAccounts.length === 0 ? "No accounts added" : "-- Select Account --"}</option>
                    {payoutAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.accountNickname || `Account ending in ...${acc.mockAccountNumberLast4}`}</option>
                    ))}
                </select>
            </div>
          </div>
          <Button type="submit" variant="primary" disabled={payoutAccounts.length === 0 || !payoutAmount}>Request Payout</Button>
        </form>

        {/* Manage Payout Accounts */}
        <section>
          <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Manage Payout Accounts</h3>
          {!showAddAccountForm && (
            <Button onClick={() => setShowAddAccountForm(true)} leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} />} variant="ghost" size="sm" className="mb-3 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 border">Add Bank Account</Button>
          )}
          {showAddAccountForm && (
            <form onSubmit={handleAddAccountSubmit} className="p-3 my-2 bg-gray-100 dark:bg-gray-700/50 rounded-md space-y-3 border dark:border-gray-600">
              <h4 className="text-sm font-semibold">Add New Bank Account (Mock)</h4>
              {formError && !payoutAmount && <p className="text-xs text-red-500 dark:text-red-400">{formError}</p>}
              <Input label="Account Nickname (Optional)" name="accountNickname" value={accountNickname} onChange={(e) => setAccountNickname(e.target.value)} placeholder="e.g., My Savings" />
              <Input label="Bank Name (Mock)" name="mockBankName" value={mockBankName} onChange={(e) => setMockBankName(e.target.value)} placeholder="e.g., Mock First National" required />
              <Input label="Account Number (Mock)" name="mockAccountNumber" type="text" value={mockAccountNumber} onChange={(e) => setMockAccountNumber(e.target.value)} placeholder="Enter at least 4 digits" required />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddAccountForm(false)} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Add Account</Button>
              </div>
            </form>
          )}
          {payoutAccounts.length === 0 && !showAddAccountForm ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No payout accounts added yet.</p>
          ) : (
            <ul className="space-y-2">
              {payoutAccounts.map(acc => (
                <li key={acc.id} className="p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{acc.accountNickname} {acc.isPrimary && <span className="text-xs text-green-500 dark:text-green-400">(Primary)</span>}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{acc.mockBankName} - ****{acc.mockAccountNumberLast4}</p>
                  </div>
                  <div className="space-x-1">
                    {!acc.isPrimary && <Button variant="ghost" size="sm" onClick={() => onSetPrimaryAccount(acc.id)} className="text-xs dark:text-gray-300 dark:hover:bg-gray-600">Set Primary</Button>}
                    <Button variant="danger" size="sm" onClick={() => onDeleteAccount(acc.id)} className="text-xs">Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Payout History */}
        <section>
          <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Payout History</h3>
          {payoutHistory.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No payout history available.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-md">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Date</th>
                    <th className="px-2 py-1.5 text-left font-medium">Amount</th>
                    <th className="px-2 py-1.5 text-left font-medium">Destination</th>
                    <th className="px-2 py-1.5 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-600">
                  {payoutHistory.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-2 py-1.5 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-2 py-1.5 font-medium text-green-600 dark:text-green-400">${entry.amount.toFixed(2)}</td>
                      <td className="px-2 py-1.5">{entry.destination}</td>
                      <td className={`px-2 py-1.5 font-semibold ${entry.status === 'paid' ? 'text-green-500 dark:text-green-400' : (entry.status === 'failed' ? 'text-red-500 dark:text-red-400' : 'text-yellow-500 dark:text-yellow-400')}`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};

export default PayoutSettingsModal;