import { GameRole } from './models/game-role.entity';
import { User } from "./models/user.entity";
import { getRepository, getManager} from "typeorm";
import crypto from "crypto";
import Mail from "nodemailer/lib/mailer";
import Filter from "bad-words"
const nodemailer = require("nodemailer");
require("dotenv").config();
const config = process.env;

export default class UserService {
  transport: Mail;
  allowedOutfits = [39, 65, 32, 3, 17, 63, 9, 14, 34, 16]
  genders = [1, 1, 1, 0, 0, 1, 0, 0, 1, 0]
  public constructor() {
    this.transport = nodemailer.createTransport({
      host: config.SERVICE_HOST,
      secure: true,
      port: config.SERVICE_PORT,
      auth: {
        user: config.EMAIL_USERNAME,
        pass: config.EMAIL_PASSWORD,
      },
    });
    this.transport.verify(function(error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
  }

  public async register(username: string, email: string, password: string) {
    if (username === undefined || password === undefined || email === undefined)
      return { error: "Invalid args" };
    if(username.length < 6 || username.length > 50)
      return { error: "Invalid username length" }
      if(password.length < 6 || password.length > 50)
      return { error: "Invalid password length" }
    if (!this.isEmailValid(email))
      return { error: "Use another email provider" };
    let user = await getRepository(User).findOne({ account: username });
    if (user) return { error: "Try another username" };
    user = await getRepository(User).findOne({ account: username });
    if (user) return { error: "Email already in use" };

    if (!this.isUsernameValid(username))
      return { error: "Invalid username length" };
    if (!this.isPasswordValid(password))
      return { error: "Invalid password length" };
    await getRepository(User).insert({
      account: username,
      email: email,
      psw: crypto
        .scryptSync(password, process.env.HASH_SECRET, 64)
        .toString("hex"),
    });
    this.requestVerify(email);
    return this.login(username, password);
  }

  

  private isEmailValid(email: string): boolean {
    if (
      !email.match(
        /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
      )
    )
      return false;
    if (
      !(
        email.includes("@hotmail.") ||
        email.includes("@gmail.") ||
        email.includes("@googlemail.") ||
        email.includes("@outlook.") ||
        email.includes("@yahoo.")
      )
    )
      return false;
    return true;
  }


  async createRole(token: string, name:string, clothing: number, nation:number){
    if (token === undefined || !this.allowedOutfits.includes(clothing) || nation > 4 || name === undefined) return { error: "Invalid args" };

    let user = await this.getUser(token);
    if (user.error)
      return {error: "Invalid token"};
    if ((new Filter()).isProfane(name))
      return {error: "No profanity"}
    let role = await getRepository(GameRole).findOne({account: user.username});
    if(role)
      return {error: "Existing character"}
    role = await getRepository(GameRole).findOne({name: name});
    if(role)
      return {error: "Use another name"}

    await getManager().query(
      `INSERT INTO game_role VALUES ('${name}', '${this.generateToken(64)}', '${user.username}', '', 0, 0, 0, x'${Array.prototype.map.call(new Uint8Array([15, 0, 0, 0, 1, this.genders[this.allowedOutfits.indexOf(clothing)], 0, 0, 0, 1, clothing, 0, 0, 0, 1, nation, 0, 0, 0]), x => ('00' + x.toString(16)).slice(-2)).join('')}', null, ${(new Date()).getTime()}, 0)`
    );
    return {message: "Character created"}
  }

  async getRole(token: string){
    if (token === undefined) return { error: "Invalid args" };
    let user = await getRepository(User).findOne({ access_token: token });
    if (!user) return { error: "Invalid Token" };
    let role = await getRepository(GameRole).findOne({account: user.account});
    if (!role)
      return {name: ""}
    return {name: role.name}
  }

  async getUser(token: string) {
    if (token === undefined) return { error: "Invalid args" };
    let user = await getRepository(User).findOne({ access_token: token });
    if (!user) return { error: "Invalid Token" };
    return {
      username: user.account,
      email: user.email,
    };
  }

  private createForgotEmail(token: string): string {
    return `
        <h1>You forgot your password?? Oh No!</h1>
        <p>Just kidding, heres a reset link</p>
        <a href='http://stallninja-env.eba-mszmpmqm.eu-west-2.elasticbeanstalk.com/user/forgot/${token}'>https://stallninja-env.eba-mszmpmqm.eu-west-2.elasticbeanstalk.com:3000/user/forgot/${token}</a>
        `;
  }

  private createVerifyEmail(token: string) {
    return `
      <h1>Welcome to the stall :)</h1>
      <p>Click on the link below to verify your email</p>
      <a href='http://stallninja-env.eba-mszmpmqm.eu-west-2.elasticbeanstalk.com/user/verify/${token}'>https://stallninja-env.eba-mszmpmqm.eu-west-2.elasticbeanstalk.com:3000/user/verify/${token}</a>
    `;
  }

  public async login(username: string, password: string) {
    if (username === undefined || password === undefined)
      return { error: "Invalid args" };

    let user = await getRepository(User).findOne({ account: username });
    if (!user)
      if (!(user = await getRepository(User).findOne({ email: username })))
        return { error: "Cannot find user" };
    if (!user.verified) return { error: "Please verify your email" };
    if (
      user.psw ===
      crypto.scryptSync(password, process.env.HASH_SECRET, 64).toString("hex")
    ) {
      let token = this.generateToken(30);
      await getRepository(User).update(
        { account: user.account },
        { access_token: token }
      );
      return { token: token };
    }
    return { error: "Wrong password" };
  }

  async changeCurrent(
    token: string,
    currPassword: string,
    newPassword: string
  ) {
    if (
      token === undefined ||
      currPassword === undefined ||
      newPassword === undefined
    )
      return { error: "Invalid args" };
    let user = await getRepository(User).findOne({ access_token: token });
    if (!user) return { error: "Invalid token" };
    if (
      !(
        user.psw ==
        crypto
          .scryptSync(currPassword, process.env.HASH_SECRET, 64)
          .toString("hex")
      )
    )
      return { error: "Wrong person" };
    if (!this.isPasswordValid(newPassword))
      return { error: "New password is not valid" };
    await getRepository(User).update(
      { account: user.account },
      {
        psw: crypto
          .scryptSync(newPassword, process.env.HASH_SECRET, 64)
          .toString("hex"),
      }
    );
    return { message: "Password changed" };
  }

  public async requestForgot(email: string) {
    if (email === undefined) return { error: "Invalid args" };
    let user = await getRepository(User).findOne({ email: email });
    if (!user) return { message: "Success" };
    const forgot_token = this.generateToken(64);
    await getRepository(User).update(
      { account: user.account },
      { forgot_token: forgot_token }
    );
    await this.transport.sendMail({
      from: '"Stall Ninja 🐱‍👤" <donotreplystall@gmail.com>',
      to: `${email}`,
      subject: "You forgot your stall password",
      html: this.createForgotEmail(forgot_token),
    });
    return { message: "Success" };
  }

  async changePassword(password: string, token: string) {
    if (password === undefined || token === undefined || token.length < 64)
      return { error: "Invalid args" };

    let user = await getRepository(User).findOne({ forgot_token: token });
    if (!user) return { error: "Token has expired" };
    if (!this.isPasswordValid(password)) return { error: "Password not valid" };
    await getRepository(User).update(
      { account: user.account },
      {
        psw: crypto
          .scryptSync(password, process.env.HASH_SECRET, 64)
          .toString("hex"),
        forgot_token: undefined,
      }
    );
    return { message: "Password changed successfully" };
  }

  async changeCurrentPassword(currPassword: string, newPassword: string, token: string) {
    if (currPassword === undefined || newPassword === undefined || token === undefined)
      return { error: "Invalid args" };

    let user = await getRepository(User).findOne({access_token: token});
    if (!user) return { error: "Invalid token" };
    if(user.psw !== crypto.scryptSync(currPassword, process.env.HASH_SECRET, 64).toString("hex"))
      return {error: "Wrong password"}
    if (!this.isPasswordValid(newPassword)) return { error: "Password not valid" };
    await getRepository(User).update(
      { account: user.account },
      {
        psw: crypto
          .scryptSync(newPassword, process.env.HASH_SECRET, 64)
          .toString("hex"),
        forgot_token: undefined,
      }
    );
    return { message: "Password changed successfully" };
  }

  async verifyEmail(token: string) {
    if (token === undefined) return { error: "Invalid args" };
    let user = await getRepository(User).findOne({ verify_token: token });
    if (!user) return { error: "Token has expired" };
    if (user.verified) return { error: "Already verified" };
    await getRepository(User).update(
      { account: user.account },
      {
        verify_token: undefined,
        verified: true,
      }
    );
    return { message: "Success" };
  }

  async requestVerify(email: string) {
    if (email === undefined) return { error: "Invalid args" };

    let user = await getRepository(User).findOne({ email: email });
    if (!user) return { message: "Success" };
    if (user.verified) return { error: "Already verified" };

    let token = this.generateToken(64);

    await getRepository(User).update(
      { account: user.account },
      { verify_token: token }
    );

    await this.transport.sendMail({
      from: '"Stall Ninja 🐱‍👤" <donotreplystall@gmail.com>',
      to: `${email}`,
      subject: "Verify your email",
      html: this.createVerifyEmail(token),
    });
    return { message: "Success" };
  }

  private isPasswordValid(password: string): boolean {
    return !(password.length < 6 || password.length > 14);
  }

  private isUsernameValid(username: string): boolean {
    return !(username.length < 6 || username.length > 50);
  }

  private generateToken(size: number): string {
    return crypto.randomBytes(size).toString("hex");
  }

  async logout(token: string) {
    if (token === undefined) return { error: "Invalid args" };

    let user = await getRepository(User).findOne({ access_token: token });
    if (!user) return { error: "Invalid Token" };
    await getRepository(User).update(
      { account: user.account },
      { access_token: undefined }
    );
    return { message: "Successfully logged out" };
  }
}