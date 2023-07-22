import md5 from "spark-md5";
import { type NextRequest } from "next/server";



const Alipay = require('alipay-mobile').default


const appSecret = process.env.XUNHU_PAY_APPSECRET!;
//notify_url: 异步通知url
//app_id: 开放平台 appid
//appPrivKeyFile: 你的应用私钥
//alipayPubKeyFile: 蚂蚁金服公钥
const options = {
  app_id: '2021004105685136',
  appPrivKeyFile: appSecret,
  alipayPubKeyFile: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg5gegpGI96CVu2tkDj7sKoPqSZGsK++oTrd1ICI1p06LpgHr3DnluHrzq4zCAQWitKEzLSUxHmRFEKp3Y6T+PJaTN+CAQUuBzqCNlmhMzJzhH8Qi9XEhMCTTtA+0A/An6kvw7kG59+Gk7bzZlBzxIXovuowtq3CljHqsHlHTbRi05p8zf7rhtIpJFVZzuOa+119/cNVDDyC89KriG9q12dWwAOHl/VbW7e+Qosya7ILPZpl94ILg4EtjyjjRb61QszJx2HUgEfaCC9xqkxe6+176TDxS3ShWEENr7F0EkBO8D2jZ0CXxTDDdsufPfNXcHBJgjh/F3mKU12rsdWJnIQIDAQAB"
}



const appId = process.env.XUNHU_PAY_APPID!;
const wapName = process.env.PAY_WAPNAME ?? "店铺名称";

const domain = process.env.DOMAIN;
const callbackDomain = process.env.CALLBACK_DOMAIN ?? domain;

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
  openid: number; // 来自文档：订单id(此处有个历史遗留错误，返回名称是openid，值是orderid，一般对接不需要这个参数)
  url_qrcode: string;
  url: string;
  errcode: number;
  errmsg: string;
  hash?: string;
}

export interface CallbackBody {
  trade_order_id: string;
  trade_fee: number;
  transaction_id: number;
  open_order_id: string;
  order_title: string;
  status: string;
  plugins?: string;
  appid: string;
  time: string;
  nonce_str: string;
  hash?: string;
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
    subject: '辣条',
    out_trade_no: '1232423',
    total_amount: '100'
  }
  const basicParams = {
    return_url: 'http://xxx.com'
  }
  const result = service.createPageOrderURL(data, basicParams)
  console.log("result.code", result.code)
  console.log("result.message", result.message)


  try {
    return (await result.json()) as PaymentResponse;
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
  if (body.appid !== appId) return null;

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

  return body.trade_order_id;
}
