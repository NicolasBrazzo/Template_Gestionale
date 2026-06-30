// Ritorna true se le date sono coerenti: la consegna non può essere
// precedente alla raccolta. Se manca una delle due non c'è nulla da
// confrontare e si considera valido (la presenza è gestita da `required`).
export const validateDeliveryDates = (collectionDate, deliveryDate) => {
  if (!collectionDate || !deliveryDate) return true;
  return new Date(deliveryDate) >= new Date(collectionDate);
};
