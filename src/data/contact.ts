export const whatsappPhoneNumber = "51986206531";

export function getWhatsAppUrl(message = "") {
  const url = `https://api.whatsapp.com/send?phone=${whatsappPhoneNumber}`;
  return message ? `${url}&text=${encodeURIComponent(message)}` : url;
}
