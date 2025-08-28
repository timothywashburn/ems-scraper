export const decodeText = (text: string): string => {
    return text.replace(/&amp;/g, '&')
};