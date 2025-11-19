/**
 * Unit tests for ErrorService redaction functionality
 *
 * Tests secret redaction patterns to ensure credentials
 * never leak into logs or error messages.
 */

import { describe, it, expect } from 'vitest';
import { ErrorService } from '../../src/errors/redact.js';

describe('ErrorService.redact()', () => {
  describe('Authorization header redaction', () => {
    it('should redact Bearer tokens', () => {
      const input = 'Authorization: Bearer abc123xyz456';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('abc123xyz456');
      expect(output).toContain('[REDACTED]');
      expect(output).toContain('Authorization:');
    });

    it('should redact Basic auth credentials', () => {
      const input = 'Authorization: Basic dXNlcjpwYXNzd29yZA==';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('dXNlcjpwYXNzd29yZA==');
      expect(output).toContain('[REDACTED]');
    });

    it('should handle mixed case Authorization headers', () => {
      const input = 'authorization: bearer SecretToken123';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('SecretToken123');
      expect(output).toContain('[REDACTED]');
    });
  });

  describe('API key and token redaction', () => {
    it('should redact api_key=value patterns', () => {
      const input = 'Connect with api_key=secret123';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('secret123');
      expect(output).toContain('api_key=[REDACTED]');
    });

    it('should redact api-key=value patterns', () => {
      const input = 'Config: api-key=mykey456';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('mykey456');
      expect(output).toContain('[REDACTED]');
    });

    it('should redact apikey=value patterns', () => {
      const input = 'URL: https://api.com?apikey=xyz789';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('xyz789');
      expect(output).toContain('[REDACTED]');
    });

    it('should redact token=value patterns', () => {
      const input = 'Query string: token=sensitive_token_here';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('sensitive_token_here');
      expect(output).toContain('token=[REDACTED]');
    });

    it('should redact secret=value patterns', () => {
      const input = 'Config: secret=topsecret';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('topsecret');
      expect(output).toContain('secret=[REDACTED]');
    });

    it('should redact password=value patterns', () => {
      const input = 'Login with password=mypassword123';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('mypassword123');
      expect(output).toContain('password=[REDACTED]');
    });
  });

  describe('URL query parameter redaction', () => {
    it('should redact token in query string', () => {
      const input = 'https://api.com/endpoint?token=abc123&other=value';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('abc123');
      expect(output).toContain('[REDACTED]');
      expect(output).toContain('other=value');
    });

    it('should redact multiple sensitive parameters', () => {
      const input = 'https://api.com?key=secret1&token=secret2&name=public';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('secret1');
      expect(output).not.toContain('secret2');
      expect(output).toContain('name=public');
    });
  });

  describe('Multiple pattern redaction', () => {
    it('should redact multiple secrets in same string', () => {
      const input = 'Headers: Authorization: Bearer token123, API-Key: key456';
      const output = ErrorService.redact(input);

      expect(output).not.toContain('token123');
      expect(output).not.toContain('key456');
      expect(output).toMatch(/\[REDACTED\]/);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      const output = ErrorService.redact('');
      expect(output).toBe('');
    });

    it('should handle strings with no secrets', () => {
      const input = 'This is a normal error message with no secrets';
      const output = ErrorService.redact(input);
      expect(output).toBe(input);
    });

    it('should not modify non-sensitive field names', () => {
      const input = 'username=john, email=john@example.com';
      const output = ErrorService.redact(input);
      expect(output).toContain('username=john');
      expect(output).toContain('email=john@example.com');
    });
  });
});

describe('ErrorService.redactObject()', () => {
  describe('Sensitive field name redaction', () => {
    it('should redact password field', () => {
      const input = { username: 'user', password: 'secret123' };
      const output = ErrorService.redactObject(input);

      expect(output.username).toBe('user');
      expect(output.password).toBe('[REDACTED]');
    });

    it('should redact token field', () => {
      const input = { id: '123', token: 'abc456' };
      const output = ErrorService.redactObject(input);

      expect(output.id).toBe('123');
      expect(output.token).toBe('[REDACTED]');
    });

    it('should redact apikey field', () => {
      const input = { name: 'test', apikey: 'key789' };
      const output = ErrorService.redactObject(input);

      expect(output.name).toBe('test');
      expect(output.apikey).toBe('[REDACTED]');
    });

    it('should redact api_key field', () => {
      const input = { api_key: 'secret' };
      const output = ErrorService.redactObject(input);

      expect(output.api_key).toBe('[REDACTED]');
    });

    it('should redact authorization field', () => {
      const input = { authorization: 'Bearer token' };
      const output = ErrorService.redactObject(input);

      expect(output.authorization).toBe('[REDACTED]');
    });
  });

  describe('String value redaction', () => {
    it('should redact Bearer tokens in string values', () => {
      const input = {
        headers: 'Authorization: Bearer abc123',
        data: 'normal value'
      };
      const output = ErrorService.redactObject(input);

      expect(output.headers).not.toContain('abc123');
      expect(output.headers).toContain('[REDACTED]');
      expect(output.data).toBe('normal value');
    });
  });

  describe('Nested object redaction', () => {
    it('should redact nested sensitive fields', () => {
      const input = {
        user: {
          name: 'john',
          password: 'secret'
        },
        config: {
          url: 'https://api.com',
          token: 'abc123'
        }
      };
      const output = ErrorService.redactObject(input);

      expect((output.user as Record<string, unknown>).name).toBe('john');
      expect((output.user as Record<string, unknown>).password).toBe('[REDACTED]');
      expect((output.config as Record<string, unknown>).url).toBe('https://api.com');
      expect((output.config as Record<string, unknown>).token).toBe('[REDACTED]');
    });
  });

  describe('Array handling', () => {
    it('should redact strings in arrays', () => {
      const input = {
        headers: [
          'Authorization: Bearer token123',
          'Content-Type: application/json'
        ]
      };
      const output = ErrorService.redactObject(input);
      const headers = output.headers as string[];

      expect(headers[0]).not.toContain('token123');
      expect(headers[0]).toContain('[REDACTED]');
      expect(headers[1]).toBe('Content-Type: application/json');
    });

    it('should redact objects in arrays', () => {
      const input = {
        credentials: [
          { username: 'user1', password: 'pass1' },
          { username: 'user2', password: 'pass2' }
        ]
      };
      const output = ErrorService.redactObject(input);
      const creds = output.credentials as Array<Record<string, unknown>>;

      expect(creds[0]?.username).toBe('user1');
      expect(creds[0]?.password).toBe('[REDACTED]');
      expect(creds[1]?.username).toBe('user2');
      expect(creds[1]?.password).toBe('[REDACTED]');
    });
  });

  describe('Primitive value preservation', () => {
    it('should preserve numbers', () => {
      const input = { id: 123, count: 456 };
      const output = ErrorService.redactObject(input);

      expect(output.id).toBe(123);
      expect(output.count).toBe(456);
    });

    it('should preserve booleans', () => {
      const input = { enabled: true, active: false };
      const output = ErrorService.redactObject(input);

      expect(output.enabled).toBe(true);
      expect(output.active).toBe(false);
    });

    it('should preserve null and undefined', () => {
      const input = { nullable: null, optional: undefined };
      const output = ErrorService.redactObject(input);

      expect(output.nullable).toBeNull();
      expect(output.optional).toBeUndefined();
    });
  });
});

describe('ErrorService.containsSensitiveData()', () => {
  it('should detect Bearer tokens', () => {
    const text = 'Authorization: Bearer abc123';
    expect(ErrorService.containsSensitiveData(text)).toBe(true);
  });

  it('should detect API keys', () => {
    const text = 'Connect with api_key=secret';
    expect(ErrorService.containsSensitiveData(text)).toBe(true);
  });

  it('should return false for clean strings', () => {
    const text = 'This is a normal message';
    expect(ErrorService.containsSensitiveData(text)).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(ErrorService.containsSensitiveData('')).toBe(false);
  });
});
