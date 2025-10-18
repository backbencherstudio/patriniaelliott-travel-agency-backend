import { IStorage } from './iStorage';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { DiskOption } from '../Option';
import * as path from 'path';

/**
 * LocalAdapter for local file storage
 */
export class LocalAdapter implements IStorage {
  private _config: DiskOption;

  constructor(config: DiskOption) {
    this._config = config;
  }

  /**
   * returns file url
   * @param key
   * @returns
   */
  url(key: string): string {
    const appUrl = process.env.APP_URL || 'http://localhost:4000';
    return `${appUrl}${this._config.connection.publicUrl}${key}`;
  }

  /**
   * check if file exists
   * @param key
   * @returns
   */
  async isExists(key: string): Promise<boolean> {
    try {
      if (fsSync.existsSync(`${this._config.connection.rootUrl}/${key}`)) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  /**
   * get data
   * @param key
   */
  async get(key: string) {
    try {
      const data = await fs.readFile(
        `${this._config.connection.rootUrl}/${key}`,
        {
          encoding: 'utf8',
        },
      );
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * put data
   * @param key
   * @param value
   */
  async put(key: string, value: any) {
    try {
      const filePath = path.join(this._config.connection.rootUrl, key);
      
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
      console.log('-----------dirPath---------------------');
      console.log({filePath});
      console.log('--------------------------------');
      
      await fs.writeFile(filePath, value);
    } catch (err) {
      console.error('🔍 [LOCAL ADAPTER ERROR] put() failed:', err);
      throw err;
    }
  }
  /**
   * delete data
   * @param key
   */
  async delete(key: string) {
    try {
      await fs.unlink(`${this._config.connection.rootUrl}/${key}`);
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(err);
    }
  }
}
