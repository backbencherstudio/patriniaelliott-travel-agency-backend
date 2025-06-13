import { ApiProperty } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({
    description: 'Language name',
    example: 'English',
  })
  name: string;

  @ApiProperty({
    description: 'Language code',
    example: 'en',
  })
  code: string;
}
