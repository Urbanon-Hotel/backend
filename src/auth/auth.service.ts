import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  validatePassword(password: string, userPassword: string): boolean {
    return bcrypt.compareSync(password, userPassword);
  }

  generateToken(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const secret = jwtConstants.secret;

    return this.jwtService.sign(payload, {
      expiresIn: '365d',
      secret,
    });
  }

  async register(dto: CreateUserDto) {
    const { email } = dto;

    const userInDb = await this.userService.findEmail(email);

    if (userInDb)
      throw new BadRequestException(
        `User with email ${email} has already exists!`,
      );

    await this.userService.create(dto);

    return {
      message: 'Register success!',
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findEmail(email);

    if (!user) {
      throw new NotFoundException(`User not found!`);
    }

    const isPasswordValid: boolean = this.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid Password !');
    }

    const token = this.generateToken(user);

    return token;
  }
}
