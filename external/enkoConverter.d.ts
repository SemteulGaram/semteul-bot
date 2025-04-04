/**
 * Type declaration for enkoConverter.js
 * Converts between English and Korean keyboard layouts
 */

/**
 * Converts text between English and Korean keyboard layouts
 * @param isEnToKo - If true, converts from English to Korean. If false, converts from Korean to English.
 * @param text - The text to convert
 * @returns The converted text
 */
declare function doConvert(isEnToKo: boolean, text: string): string;

export default doConvert;
