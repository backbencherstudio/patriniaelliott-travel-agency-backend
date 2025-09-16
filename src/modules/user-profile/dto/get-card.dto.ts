import { IsNotEmpty, IsString } from 'class-validator';

export class GetUserCardDto {
    @IsNotEmpty()
    @IsString()
    customer_id: string
}
