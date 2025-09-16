// external imports
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
// import express from 'express';
// internal imports
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { CustomExceptionFilter } from './common/exception/custom-exception.filter';
import { SojebStorage } from './common/lib/Disk/SojebStorage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Handle raw body for webhooks
  // app.use('/payment/stripe/webhook', express.raw({ type: 'application/json' }));

  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(helmet());
  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    index: false,
    prefix: '/public',
  });
  
  // Serve storage files with proper configuration
  app.useStaticAssets(join(__dirname, '..', 'public/storage'), {
    index: false,
    prefix: '/storage',
    setHeaders: (res, path) => {
      // Set proper headers for images
      if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif') || path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/' + path.split('.').pop());
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      }
    },
    // Add fallback for missing files
    fallthrough: true,
  });
  
  // Add specific route for package images to ensure they're served
  app.use('/storage/package/:filename', (req, res, next) => {
    const filename = req.params.filename;
    const filePath = join(__dirname, '..', 'public/storage/package', filename);
    
    console.log(`🔍 Package image requested: ${filename}`);
    console.log(`📁 Full path: ${filePath}`);
    
    // Check if file exists
    if (require('fs').existsSync(filePath)) {
      console.log('✅ File exists, serving...');
      return res.sendFile(filePath);
    } else {
      console.log('❌ File not found, checking for similar files...');
      
      // List all files in the directory to debug
      const fs = require('fs');
      const files = fs.readdirSync(join(__dirname, '..', 'public/storage/package'));
      console.log('📁 Available files:', files);
      
      // Check if there's a file that starts with this name
      const similarFiles = files.filter(f => f.startsWith(filename));
      if (similarFiles.length > 0) {
        console.log('🔍 Found similar files:', similarFiles);
        // Redirect to the first similar file
        return res.redirect(`/storage/package/${encodeURIComponent(similarFiles[0])}`);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Image not found',
        filename: filename,
        path: filePath,
        availableFiles: files.slice(0, 10) // Show first 10 files for debugging
      });
    }
  });
  

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new CustomExceptionFilter());
  app.useGlobalPipes()

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
