export function parseFirebaseDate(rawDate: any): Date {
  if (!rawDate) return new Date();

  // 1. Timestamp do Firestore
  if (typeof rawDate.toDate === 'function') {
    return rawDate.toDate(); 
  } 
  
  // 2. Objeto serializado do Firestore com segundos
  if (typeof rawDate.seconds === 'number') {
    return new Date(rawDate.seconds * 1000);
  } 
  
  // 3. String ISO ou objeto Date
  const parsedDate = new Date(rawDate);
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}