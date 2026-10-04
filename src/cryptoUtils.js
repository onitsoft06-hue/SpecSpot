import CryptoJS from 'crypto-js';

// 실제 운영 환경에서는 환경 변수로 엄격히 분리하여 노출을 막아야 합니다.
// 현재는 개발용 더미 시크릿 키를 사용합니다.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'super-secret-specspot-key-2026';

/**
 * 텍스트를 안전한 AES-256 방식으로 암호화합니다.
 * @param {string} text - 암호화할 원본 텍스트
 * @returns {string} 암호화된 문자열
 */
export const encryptData = (text) => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

/**
 * AES-256 방식으로 암호화된 텍스트를 복호화(해독)합니다.
 * @param {string} cipherText - 암호화된 문자열
 * @returns {string} 복호화된 원본 텍스트
 */
export const decryptData = (cipherText) => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("복호화 중 에러 발생:", error);
    return '';
  }
};
