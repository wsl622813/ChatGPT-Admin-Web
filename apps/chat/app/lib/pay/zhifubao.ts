import md5 from "spark-md5";
import { type NextRequest } from "next/server";



const Alipay = require('alipay-mobile').default

const return_url = process.env.DOMAIN!;
const notify_url = process.env.CALLBACK_DOMAIN! ;
const appSecret = process.env.XUNHU_PAY_APPSECRET!;
//notify_url: 异步通知url
//app_id: 开放平台 appid
//appPrivKeyFile: 你的应用私钥
//alipayPubKeyFile: 蚂蚁金服公钥
const options = {
  app_id: '2021001167685633',
  appPrivKeyFile: appSecret,
  alipayPubKeyFile: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg5gegpGI96CVu2tkDj7sKoPqSZGsK++oTrd1ICI1p06LpgHr3DnluHrzq4zCAQWitKEzLSUxHmRFEKp3Y6T+PJaTN+CAQUuBzqCNlmhMzJzhH8Qi9XEhMCTTtA+0A/An6kvw7kG59+Gk7bzZlBzxIXovuowtq3CljHqsHlHTbRi05p8zf7rhtIpJFVZzuOa+119/cNVDDyC89KriG9q12dWwAOHl/VbW7e+Qosya7ILPZpl94ILg4EtjyjjRb61QszJx2HUgEfaCC9xqkxe6+176TDxS3ShWEENr7F0EkBO8D2jZ0CXxTDDdsufPfNXcHBJgjh/F3mKU12rsdWJnIQIDAQAB",
  gatewayUrl: "https://openapi.alipay.com/gateway.do",
  notify_url: notify_url,
}



const appId = process.env.XUNHU_PAY_APPID!;
const wapName = process.env.PAY_WAPNAME ?? "店铺名称";


interface PaymentArgs {
  version: string;
  appid: string;
  trade_order_id: string;
  total_fee: number;
  title: string;
  time: number;
  notify_url: string;
  return_url?: string;
  callback_url?: string;
  plugins?: string;
  attach?: string;
  nonce_str: string;
  type: string;
  wap_url: string;
  wap_name: string;
}

interface PaymentResponse {
  code: number;
  message: string;
  data: string;
}

export interface CallbackBody {
  notify_time: string; // 通知的发送时间。格式为yyyy-MM-dd HH:mm:ss
  notify_type: string; // 通知的类型
  notify_id: string; // 通知校验ID
  app_id: string; // 支付宝分配给开发者的应用Id
  charset: string; // 编码格式，如utf-8、gbk、gb2312等
  version: string; // 调用的接口版本，固定为：1.0
  sign_type: string; // 签名类型
  trade_no: string;// 支付宝交易凭证号
  out_trade_no: string; // 原支付请求的商户订单号
  sign: string; // 签名
  trade_status: string; //交易状态
  [key: string]: string | number// 可选参数
}

/**
 * Sort the key names and link together
 * @param parameters
 * @return linked sting
 */
function sortAndSignParameters(parameters: PaymentArgs | CallbackBody): string {
  // 过滤空值参数
  const filteredParameters = Object.entries(parameters).filter(
    ([, value]) => value !== null,
  );

  // 按照参数名的ASCII码从小到大排序（字典序）
  const sortedParameters = filteredParameters.sort(([keyA], [keyB]) =>
    keyA.localeCompare(keyB),
  );

  // 使用URL键值对的格式拼接成字符串
  const stringA = sortedParameters
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return stringA;
}

/**
 * Request a order
 * @param orderId internal order id
 * @param price the price need to be paid
 * @param attach encrypted field being transmitted.
 * @param title payment title
 */
export async function startPay({
  orderId,
  price,
  attach,
  title,
}: {
  orderId: string;
  price: number;
  attach: string;
  title?: string;
}) {

  const service = new Alipay(options)
  const data = {
    subject: title,
    out_trade_no: orderId,
    total_amount: price.toFixed(1)
  }
  const basicParams = {
    return_url: return_url
  }
  const result = service.createPageOrderURL(data, basicParams)
  console.log("result.code", result.code)
  console.log("result.message", result.message)
  console.log("result.data", result.data)


  try {
    return result as PaymentResponse;
  } catch (e) {
    return null;
  }
}

function urlEncodedStringToJson(encodedString: string): Record<string, string> {
  const urlParams = new URLSearchParams(encodedString);
  return Object.fromEntries(urlParams.entries());
}

/**
 * Verification callback data
 * @param req
 * @return return order id in system
 */
export async function handleCallback(req: NextRequest) {
  const body = urlEncodedStringToJson(
    await req.text(),
  ) as unknown as CallbackBody;
  /* == Verify Security field == */
  /*
   Currently only the appId is being validated.
   In the future, attach will also need to be validated to improve security.
   */
  const service = new Alipay(options)
  const notifyResult = service.makeNotifyResponse(body)
  console.log("notifyResult.code", notifyResult.code)
  console.log("notifyResult.message", notifyResult.message)
  if (notifyResult.code == 0 ) // 验签成功
  {
    if (body.trade_status === "TRADE_SUCCESS")
    {
      console.log("body.out_trade_no", body.out_trade_no)
      return body.out_trade_no;
    }
  }


  return null;

  /* == Verify Signature == */
  // const trueHash = body.hash!
  // delete body.hash /* remove hash before sign */
  //
  // const stringA = sortAndSignParameters(body);
  // const hash = md5.hash(stringA + appSecret);
  //
  // if (hash !== trueHash)
  //   return null
  /* ====================== */

}
