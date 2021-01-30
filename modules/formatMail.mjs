/** Format mail is used to check keys passed to functions in userFunctions.mjs */
export default function formatMail(emailOrObjectKey) {
  return emailOrObjectKey.endsWith("_USER")
    ? `${emailOrObjectKey}`
    : `${emailOrObjectKey}_USER`;
}
