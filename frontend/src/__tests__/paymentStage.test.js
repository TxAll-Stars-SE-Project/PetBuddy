import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPaymentStageInfo } from "../utils/paymentStage.js";

describe("getPaymentStageInfo", () => {
  it("uses the final stage and remaining amount when the booking awaits final payment", () => {
    assert.deepEqual(
      getPaymentStageInfo(
        { bookingstatus: "waiting_final_payment" },
        { payment_stage: "full", remainingAmount: 703, totalPrice: 1005 },
      ),
      { paymentStage: "final", isFinalPayment: true, amountDueNow: 703 },
    );
  });

  it("uses the deposit amount for a deposit plan", () => {
    assert.deepEqual(
      getPaymentStageInfo(
        { bookingstatus: "waiting_payment" },
        { paymentplan: "deposit", depositAmount: 300, totalPrice: 1000 },
      ),
      { paymentStage: "deposit", isFinalPayment: false, amountDueNow: 300 },
    );
  });

  it("uses the total price for a full plan", () => {
    assert.deepEqual(
      getPaymentStageInfo(
        { bookingstatus: "waiting_payment" },
        { paymentplan: "full", totalPrice: 1000 },
      ),
      { paymentStage: "full", isFinalPayment: false, amountDueNow: 1000 },
    );
  });
});
