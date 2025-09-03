import { IsNotEmpty, IsString, IsEmail } from "class-validator";

export class CreateContactUsDto {
    @IsNotEmpty()
    @IsString()
    full_name: string;

    @IsNotEmpty()
    @IsString()
    phone_number: string;

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    topic: string;

    @IsNotEmpty()
    @IsString()
    message: string;

}
