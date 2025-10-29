// external imports
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import PathResolver from './utils/path-resolver';

// internal imports
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { CustomExceptionFilter } from './common/exception/custom-exception.filter';
import { SojebStorage } from './common/lib/Disk/SojebStorage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(helmet());
  // Centralized path resolution for static assets
  const publicPath = PathResolver.getPublicRootPath();

  app.useStaticAssets(publicPath, {
    index: false,
    prefix: '/public',
    setHeaders: (res, path) => {
      if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif') || path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/' + path.split('.').pop());
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      }
    },
  });

  app.use('/public/storage', (req, res, next) => {
    try {
      const filePath = join(publicPath, 'storage', req.path);
      
      console.log('🔍 [STATIC FILE DEBUG] Static file requested:', req.path);
      console.log('🔍 [STATIC FILE DEBUG] publicPath:', publicPath);
      console.log('🔍 [STATIC FILE DEBUG] Full filePath:', filePath);
      console.log('🔍 [STATIC FILE DEBUG] NODE_ENV:', process.env.NODE_ENV);
      console.log('🔍 [STATIC FILE DEBUG] File exists:', require('fs').existsSync(filePath));
      
      // Check if file exists
      if (require('fs').existsSync(filePath)) {
        // Set proper headers for images
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png') || filePath.endsWith('.gif') || filePath.endsWith('.webp')) {
          const ext = filePath.split('.').pop()?.toLowerCase();
          res.setHeader('Content-Type', `image/${ext}`);
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          // Handle preflight requests
          if (req.method === 'OPTIONS') {
            return res.status(200).end();
          }
        }

        return res.sendFile(filePath, (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Error serving file',
              error: err.message
            });
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          path: req.path,
          fullPath: filePath
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  });


  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new CustomExceptionFilter());

  // storage setup
  SojebStorage.config({
    driver: 'local',
    connection: {
      rootUrl: appConfig().storageUrl.rootUrl,
      publicUrl: appConfig().storageUrl.rootUrlPublic,
      // aws
      awsBucket: appConfig().fileSystems.s3.bucket,
      awsAccessKeyId: appConfig().fileSystems.s3.key,
      awsSecretAccessKey: appConfig().fileSystems.s3.secret,
      awsDefaultRegion: appConfig().fileSystems.s3.region,
      awsEndpoint: appConfig().fileSystems.s3.endpoint,
      minio: true,
    },
  });

  // swagger
  const options = new DocumentBuilder()
    .setTitle(`${process.env.APP_NAME} api`)
    .setDescription(`${process.env.APP_NAME} api docs`)
    .setVersion('1.0')
    .addTag(`${process.env.APP_NAME}`)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document);
  // end swagger

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
