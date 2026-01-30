

const SECRET_KEY = "NextCapSecretKey123";

export function encrypt(text) {
    const enc = new TextEncoder();
    const encoded = enc.encode(text);
    return btoa(String.fromCharCode(...encoded.map(b => b ^ SECRET_KEY.charCodeAt(0))));
}

// Decrypt a string
export function decrypt(cipher) {
    const decoded = atob(cipher);
    const dec = new Uint8Array([...decoded].map(c => c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(0)));
    return new TextDecoder().decode(dec);
}

// Expose globally
window.encrypt = encrypt;
window.decrypt = decrypt;
