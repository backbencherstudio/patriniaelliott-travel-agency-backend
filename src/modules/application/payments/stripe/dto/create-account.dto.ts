import { IsNotEmpty, IsString } from "class-validator";

export class CreateAccountDto {
    @IsNotEmpty()
    @IsString()
    payment_method: string

    @IsNotEmpty()
    @IsString()
    payment_email: string

    @IsNotEmpty()
    @IsString()
    card_holder_name: string

    @IsNotEmpty()
    @IsString()
    tax_information: string

    @IsNotEmpty()
    @IsString()
    billing_address: string
}
