import { join } from 'path';

export class PathResolver {
  /**
   * Resolve the absolute path to the `public` directory depending on environment.
   * - Production (compiled to dist): resolve relative to compiled file location
   * - Development: resolve relative to project root
   */
  static getPublicRootPath(): string {
    return process.env.NODE_ENV === 'production'
      ? join(__dirname, '..', '..', 'public')
      : join(process.cwd(), 'public');
  }

  /**
   * Resolve the absolute path to the `public/storage` directory.
   */
  static getStorageRootPath(): string {
    return join(this.getPublicRootPath(), 'storage');
  }
}

export default PathResolver;


