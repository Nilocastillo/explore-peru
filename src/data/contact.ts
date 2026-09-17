export const whatsappPhoneNumber = "51974346252";

export function getWhatsAppUrl(message: string) {
  return `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(message)}`;
}
