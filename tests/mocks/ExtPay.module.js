// Mock ExtPay for testing
const mockUser = { paid: false, paidAt: null, subscriptionStatus: null };

function ExtPay() {
  return {
    startBackground() {},
    getUser: async () => mockUser,
    openPaymentPage() {},
    onPaid: { addListener() {} },
  };
}

ExtPay._mockUser = mockUser;
export default ExtPay;
