declare module 'wechat-crypto' {
    class WechatCrypto {
      constructor(token: string, encodingAESKey: string, corpId: string);
      decrypt(encryptedText: string): { message: string };
      encrypt(text: string): string;
      getSignature(timestamp: string, nonce: string, encryptedText: string): string;
    }
  
    export = WechatCrypto;
  }
  