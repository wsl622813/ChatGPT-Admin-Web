import Image from "next/image";
import React, { FormEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { serverStatus } from "@caw/types";

import { useUserStore } from "@/app/store";
import useIntervalAsync from "@/app/hooks/use-interval-async";
import usePreventFormSubmit from "@/app/hooks/use-prevent-form";

import { Loading } from "@/app/components/loading";
import { showToast } from "@/app/components/ui-lib/ui-lib";
import Locales from "@/app/locales";
import {
  apiUserLoginGet,
  apiUserLoginGetTicket,
  apiUserLoginPost,
  apiUserRegister,
  apiUserRegisterCode,
} from "@/app/api";

import styles from "./auth.module.scss";
import { Path } from "../../constant";
import { IconButton } from "../button/button";
import BotIcon from "../../icons/bot.svg";
import LeftArrow from "../../icons/left.svg";
import WechatLogo from "../../icons/wechat-logo.png";

const wechatService = process.env.NEXT_PUBLIC_WECHAT_SERVICE;
const emailService = process.env.NEXT_PUBLIC_EMAIL_SERVICE;

const CaptchaLogin: React.FC = () => {
  const navigate = useNavigate();
  const [register, setRegister] = useState("");
  const [code, setCode] = useState("");

  const [isSubmitting, handleSubmit] = usePreventFormSubmit();
  const [isCodeSubmitting, handleCodeSubmit] = usePreventFormSubmit();

  const updateSessionToken = useUserStore((state) => state.updateSessionToken);

  const handleCode = async (event: FormEvent | undefined) => {
    if (!register)
      return showToast(Locales.User.PleaseInput(Locales.User.Phone));

    const type = register.includes("@") ? "email" : "phone";
    const res = await apiUserRegisterCode(type, register);

    switch (res.status) {
      case serverStatus.success: {
        return showToast(Locales.User.Code + Locales.User.Sent);
      }
      case serverStatus.notExist: {
        return showToast(Locales.User.NotYetRegister);
      }
      case serverStatus.wrongPassword: {
        return showToast(Locales.User.PasswordError);
      }
      default: {
        return showToast(Locales.User.PasswordError);
      }
    }
  };

  const handleLogin = async (e: FormEvent | undefined) => {
    if (!register || !code)
      return showToast(
        Locales.User.PleaseInput(`${Locales.User.Phone}, ${Locales.User.Code}`),
      );

    const res = await apiUserRegister({
      phone: register,
      verificationCode: code,
    });

    switch (res.status) {
      case serverStatus.success: {
        showToast(Locales.User.Success(Locales.User.Login));
        updateSessionToken(res.signedToken.token, res.signedToken.expiredAt);

        console.log("reg uid:", res.uid);
        navigate(Path.Chat);
        break;
      }
      case serverStatus.notExist: {
        showToast(Locales.User.NotYetRegister);
        break;
      }
      case serverStatus.wrongPassword: {
        showToast(Locales.User.PasswordError);
        break;
      }
      default: {
        showToast(Locales.Error.Unknown);
        break;
      }
    }
  };

  return (
    <div className={styles["form-container"]}>
      <input
        type="text"
        id="phone"
        value={register}
        className={styles["auth-input"]}
        onChange={(e) => setRegister(e.target.value)}
        placeholder={`${Locales.User.Phone} / ${Locales.User.Email}`}
        required
      />

      <div className={styles["row"]}>
        <input
          type="text"
          id="code"
          value={code}
          className={styles["auth-input"]}
          onChange={(e) => setCode(e.target.value)}
          placeholder={Locales.User.Code}
          required
        />
        <IconButton
          text={isCodeSubmitting ? Locales.User.Sent : Locales.User.GetCode}
          className={styles["auth-get-code-btn"]}
          type="primary"
          onClick={() => handleCodeSubmit(undefined, handleCode)}
        />
      </div>
      <div className={styles["auth-actions"]}>
        <IconButton
          onClick={() => handleSubmit(undefined, handleLogin)}
          text={`${Locales.User.Login} / ${Locales.User.Register}`}
          className={styles["auth-submit-btn"]}
          type="primary"
        />
      </div>
    </div>
  );
};

const PasswdLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, handleSubmit] = usePreventFormSubmit();
  /* Prevent duplicate form submissions */
  const updateSessionToken = useUserStore((state) => state.updateSessionToken);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password)
      return showToast(
        Locales.User.PleaseInput(
          `${Locales.User.Email}, ${Locales.User.Password}`,
        ),
      );

    const res = await apiUserLoginPost(email, password);

    switch (res.status) {
      case serverStatus.success: {
        updateSessionToken(res.signedToken.token, res.signedToken.expiredAt);
        showToast(Locales.User.Success(Locales.User.Login));
        return navigate(Path.Chat);
      }
      case serverStatus.notExist: {
        return showToast(Locales.User.NotYetRegister);
      }
      case serverStatus.wrongPassword: {
        return showToast(Locales.User.PasswordError);
      }
      default: {
        return showToast(Locales.User.PasswordError);
      }
    }
  };

  return (
    <div className={styles["form-container"]}>
      <div className={styles["row"]}>
        <input
          type="text"
          id="email"
          value={email}
          className={styles["auth-input"]}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={Locales.User.Email}
          required
        />
      </div>

      <div className={styles["row"]}>
        <input
          type="password"
          id="password"
          value={password}
          className={styles["auth-input"]}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={Locales.User.Password}
          required
        />
      </div>

      <div className={styles["auth-actions"]}>
        <IconButton text={Locales.Auth.Confirm} type="primary" />
      </div>
    </div>
  );
};

const PhoneReg: React.FC = () => {
  const navigate = useNavigate();
  const [register, setRegister] = useState("");
  const [code, setCode] = useState("");

  const [password, setPassword] = useState("");

  const [isSubmitting, handleSubmit] = usePreventFormSubmit();
  const [isCodeSubmitting, handleCodeSubmit] = usePreventFormSubmit();

  const updateSessionToken = useUserStore((state) => state.updateSessionToken);

  const handleCode = async (event: FormEvent | undefined) => {
    if (!register)
      return showToast(Locales.User.PleaseInput(Locales.User.Phone));

    if (!password)
      return showToast(Locales.User.PleaseInput(Locales.User.Password));

    const type = register.includes("@") ? "email" : "phone";
    const res = await apiUserRegisterCode(type, register);

    switch (res.status) {
      case serverStatus.success: {
        return showToast(Locales.User.Code + Locales.User.Sent);
      }
      case serverStatus.notExist: {
        return showToast(Locales.User.NotYetRegister);
      }
      case serverStatus.wrongPassword: {
        return showToast(Locales.User.PasswordError);
      }
      default: {
        return showToast(Locales.User.PasswordError);
      }
    }
  };

  const handleReg = async (e: FormEvent | undefined) => {
    if (!register || !code)
      return showToast(
        Locales.User.PleaseInput(`${Locales.User.Phone}, ${Locales.User.Code}`),
      );

    const res = await apiUserRegister({
      phone: register,
      verificationCode: code,
    });

    switch (res.status) {
      case serverStatus.success: {
        showToast(Locales.User.Success(Locales.User.Login));
        updateSessionToken(res.signedToken.token, res.signedToken.expiredAt);

        console.log("reg uid:", res.uid);
        navigate(Path.Chat);
        break;
      }
      case serverStatus.notExist: {
        showToast(Locales.User.NotYetRegister);
        break;
      }
      case serverStatus.wrongPassword: {
        showToast(Locales.User.PasswordError);
        break;
      }
      default: {
        showToast(Locales.Error.Unknown);
        break;
      }
    }
  };

  return (
    <div className={styles["form-container"]}>
      <input
        type="text"
        id="phone"
        value={register}
        className={styles["auth-input"]}
        onChange={(e) => setRegister(e.target.value)}
        placeholder={`${Locales.User.Phone} / ${Locales.User.Email}`}
        required
      />
      
      <div className={styles["row"]}>
        <input
          type="password"
          id="password"
          value={password}
          className={styles["auth-input"]}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={Locales.User.Password}
          required
        />
      </div>


      <div className={styles["row"]}>
        <input
          type="text"
          id="code"
          value={code}
          className={styles["auth-input"]}
          onChange={(e) => setCode(e.target.value)}
          placeholder={Locales.User.Code}
          required
        />
        <IconButton
          text={isCodeSubmitting ? Locales.User.Sent : Locales.User.GetCode}
          className={styles["auth-get-code-btn"]}
          type="primary"
          onClick={() => handleCodeSubmit(undefined, handleCode)}
        />
      </div>
      <div className={styles["auth-actions"]}>
        <IconButton
          onClick={() => handleSubmit(undefined, handleReg)}
          text={`${Locales.User.Register}`}
          className={styles["auth-submit-btn"]}
          type="primary"
        />
      </div>
    </div>
  );
};



export function AuthPage() {
  const [tab, setTab] = useState<"phonePswd" | "phoneCode" | "register">("phonePswd");
  console.log(wechatService);
  let content = null;
  switch (tab) {
    case "register":
      content = (
        <div className={styles["wechat-part"]}>
          <div className={styles["wechat-part-title"]}>
            {Locales.User.WeChatLogin}
          </div>
          <div className={styles["wechat-login-container"]}>
            <PhoneReg />
          </div>
          <div
            className={styles["wechat-part-go-back"]}
            onClick={() => {
              setTab("phonePswd");
            }}
          >
            <LeftArrow />
          </div>
        </div>
      );
      break;
    case "phonePswd":
    case "phoneCode":
      content = (
        <div className={styles["password-part"]}>
          <div className={styles["tab-container"]}>
            <button
              className={`${styles["tab-button"]} ${
                tab === "phonePswd" ? styles.active : ""
              }`}
              onClick={() => setTab("phonePswd")}
            >
              {Locales.User.PasswordLogin}
            </button>
            {emailService && (
              <button
                className={`${styles["tab-button"]} ${
                  tab === "phoneCode" ? styles.active : ""
                }`}
                onClick={() => setTab("phoneCode")}
              >
                {Locales.User.CodeLogin}
              </button>
            )}
          </div>
          {tab === "phonePswd" ? <PasswdLogin /> : <CaptchaLogin />}

          <div className={styles["divider"]}>
            <div className={styles["divider-line"]} />
            <div className={styles["divider-text"]}>or</div>
            <div className={styles["divider-line"]} />
          </div>
          <div className={styles["third-part-login-options"]}>
            <IconButton
              text={Locales.User.Register}
              className={styles["auth-get-code-btn"]}
              type="primary"
              onClick={() => setTab("register")}
            />
  
          </div>
        </div>
      );
      break;
  }

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div>
      <div className={styles["auth-title"]}>{Locales.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locales.Auth.Tips}</div>
      <div className={styles["auth-container"]}>{content}</div>
    </div>
  );
}
