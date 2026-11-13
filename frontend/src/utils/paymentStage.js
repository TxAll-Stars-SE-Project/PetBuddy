export function getPaymentStageInfo(booking, summary) {
  const isWaitingForFinalPayment =
    booking?.bookingstatus === "waiting_final_payment"
    || summary?.bookingstatus === "waiting_final_payment";
  const paymentStage = isWaitingForFinalPayment
    ? "final"
    : summary?.payment_stage
      || (summary?.paymentplan === "deposit" ? "deposit" : "full");
  const isFinalPayment = paymentStage === "final";
  const amountDueNow = isFinalPayment
    ? Number(summary?.remainingAmount)
    : paymentStage === "deposit"
      ? Number(summary?.depositAmount)
      : Number(summary?.totalPrice);

  return { paymentStage, isFinalPayment, amountDueNow };
}
