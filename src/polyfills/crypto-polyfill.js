// Polyfill for crypto.hash() method which is not available in crypto-browserify
import crypto from 'crypto-browserify'

// Add the hash method if it doesn't exist
if (!crypto.hash) {
  crypto.hash = function(algorithm, data, encoding = 'hex') {
    return crypto.createHash(algorithm).update(data).digest(encoding)
  }
}

export default crypto