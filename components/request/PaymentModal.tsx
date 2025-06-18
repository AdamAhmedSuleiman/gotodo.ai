// src/components/request/PaymentModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { PaymentModalProps } from '../../types.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  requestAmount,
  requestSummary,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | 'gotodo_balance'>('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [billingZip, setBillingZip] = useState(''); // New mock field
  const [country, setCountry] = useState('US'); // New mock field

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === 'credit_card') {
      if (!cardNumber || !expiryDate || !cvc || !cardholderName || !billingZip || !country) {
        setError('All credit card payment fields are required.');
        return;
      }
      if (!/^\d{13,19}$/.test(cardNumber.replace(/\s+/g, ''))) {
        setError('Invalid card number format.');
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
          setError('Invalid expiry date format (MM/YY).');
          return;
      }
      if (!/^\d{3,4}$/.test(cvc)) {
          setError('Invalid CVC format.');
          return;
      }
    }
    
    setIsLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500)); 
    setIsLoading(false);
    // Simulate success
    onPaymentSuccess();
    // Reset form for next time (will be done by handleModalClose if parent closes it)
  };
  
  const handleModalClose = () => {
    setPaymentMethod('credit_card');
    setCardNumber('');
    setExpiryDate('');
    setCvc('');
    setCardholderName('');
    setBillingZip('');
    setCountry('US');
    setError(null);
    setIsLoading(false);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Complete Your Payment (Simulated)"
      size="lg"
      footer={!isLoading ? (
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleModalClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">
            Cancel
          </Button>
          <Button type="submit" variant="primary" form="payment-form" disabled={isLoading}>
            Pay ${requestAmount.toFixed(2)}
          </Button>
        </div>
      ) : null}
    >
      <div className="space-y-4 p-1">
        {isLoading ? (
          <div className="text-center py-8">
            <LoadingSpinner text="Simulating payment processing..." />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You are paying for: <strong>{requestSummary}</strong>
            </p>
            <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              Amount Due: ${requestAmount.toFixed(2)}
            </p>
            
            <div className="my-3">
                <p className="text-xs text-center text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
                    <Icon path={ICON_PATHS.EXCLAMATION_TRIANGLE} className="w-4 h-4 inline mr-1" />
                    <strong>This is a payment simulation.</strong> No real transaction will occur. Do not enter real financial details.
                </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method:</label>
              <div className="flex space-x-4">
                { (['credit_card', 'paypal', 'gotodo_balance'] as const).map(method => (
                  <label key={method} className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value={method} 
                      checked={paymentMethod === method} 
                      onChange={() => setPaymentMethod(method)}
                      className="form-radio h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {method === 'credit_card' ? 'Credit Card' : method === 'paypal' ? 'PayPal (Mock)' : 'GoToDo Balance (Mock)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {paymentMethod === 'credit_card' && (
              <form id="payment-form" onSubmit={handlePayment} className="space-y-3">
                <Input
                  label="Cardholder Name"
                  name="cardholderName"
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="John M. Doe"
                  required
                  leftIcon={<Icon path={ICON_PATHS.USER} className="w-4 h-4 text-gray-400" />}
                />
                <Input
                  label="Card Number"
                  name="cardNumber"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0,16))}
                  placeholder="•••• •••• •••• ••••"
                  autoComplete="cc-number"
                  required
                  leftIcon={<Icon path={ICON_PATHS.CREDIT_CARD} className="w-4 h-4 text-gray-400 " />}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Expiry Date (MM/YY)"
                    name="expiryDate"
                    type="text"
                    value={expiryDate}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '').slice(0,4);
                      if (val.length > 2) val = val.slice(0,2) + '/' + val.slice(2);
                      setExpiryDate(val);
                    }}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    required
                  />
                  <Input
                    label="CVC"
                    name="cvc"
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0,4))}
                    placeholder="123"
                    autoComplete="cc-csc"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Billing Zip Code (Mock)"
                        name="billingZip"
                        type="text"
                        value={billingZip}
                        onChange={(e) => setBillingZip(e.target.value)}
                        placeholder="90210"
                        required
                    />
                     <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country (Mock)</label>
                        <select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100">
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                            {/* Add more countries as needed */}
                        </select>
                    </div>
                </div>
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
              </form>
            )}
            {paymentMethod === 'paypal' && (
                <div className="text-center py-6">
                    <Icon path={ICON_PATHS.SPARKLES} className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-700 dark:text-gray-200">Redirecting to PayPal (Simulation)...</p>
                     <Button onClick={(e) => handlePayment(e)} variant="primary" className="mt-4">Proceed with Mock PayPal</Button>
                </div>
            )}
             {paymentMethod === 'gotodo_balance' && (
                <div className="text-center py-6">
                     <Icon path={ICON_PATHS.BANKNOTES} className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-700 dark:text-gray-200">Your GoToDo Balance: <span className="font-semibold">$123.45 (Mock)</span></p>
                    <Button onClick={(e) => handlePayment(e)} variant="primary" className="mt-4">Use GoToDo Balance</Button>
                </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;
