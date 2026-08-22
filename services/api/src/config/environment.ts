export class EnvironmentConfigurationError extends Error {
  readonly code = 'INVALID_ENVIRONMENT_CONFIGURATION';
  constructor(message: string) { super(message); this.name = 'EnvironmentConfigurationError'; }
}
export type AppEnvironment = 'development' | 'staging' | 'production' | 'test';
export interface ServerEnvironment {
  nodeEnv: string; appEnv: AppEnvironment; appVersion: string; buildSha: string; serviceName: string;
  supabaseUrl: string; supabaseAnonKey: string; supabaseServiceRoleKey: string; host: string; port: number;
  corsOrigins: string[]; trustProxy: boolean; bodyLimitBytes: number; requestTimeoutMs: number; googleTimeoutMs: number;
  rateLimitWindowMs: number; rateLimitDefault: number; googleClientId?: string; googleClientSecret?: string;
  googleRedirectUri?: string; googleTokenEncryptionKey?: string; logLevel: string;
}
const productionOrigins = ['https://niagantara.com','https://www.niagantara.com','https://app.niagantara.com','https://master.niagantara.com','https://pos.niagantara.com'];
const developmentOrigins = ['http://localhost:5173','http://localhost:5174','http://localhost:5175','http://localhost:5176'];
const googleOAuthCallbackPath = '/api/v1/google-sheets/oauth/callback';
const productionGoogleOAuthHosts = new Set(['api.niagantara.com','niagantara-production.up.railway.app']);
function required(source:NodeJS.ProcessEnv,name:string){const value=source[name]?.trim();if(!value)throw new EnvironmentConfigurationError(`${name} is required.`);return value;}
function url(value:string,name:string,httpsOnly=false){try{const parsed=new URL(value);if((httpsOnly&&parsed.protocol!=='https:')||(!httpsOnly&&!['http:','https:'].includes(parsed.protocol)))throw new Error();return parsed.toString().replace(/\/$/,'');}catch{throw new EnvironmentConfigurationError(`${name} must be a valid ${httpsOnly?'HTTPS':'HTTP(S)'} URL.`);}}
function integer(source:NodeJS.ProcessEnv,name:string,fallback:number,min:number,max:number){const value=source[name]===undefined?fallback:Number(source[name]);if(!Number.isInteger(value)||value<min||value>max)throw new EnvironmentConfigurationError(`${name} must be an integer between ${min} and ${max}.`);return value;}
function boolean(source:NodeJS.ProcessEnv,name:string,fallback:boolean){const value=source[name]?.trim().toLowerCase();if(!value)return fallback;if(value==='true')return true;if(value==='false')return false;throw new EnvironmentConfigurationError(`${name} must be true or false.`);}
function appEnvironment(source:NodeJS.ProcessEnv):AppEnvironment{const value=(source.APP_ENV??source.NODE_ENV??'development').trim();if(!['development','staging','production','test'].includes(value))throw new EnvironmentConfigurationError('APP_ENV must be development, staging, production, or test.');return value as AppEnvironment;}
function origins(source:NodeJS.ProcessEnv,environment:AppEnvironment){const configured=source.CORS_ORIGINS?.split(',').map(x=>x.trim()).filter(Boolean);const values=configured?.length?configured:environment==='production'?productionOrigins:developmentOrigins;if(environment==='production'&&values.some(value=>value==='*'||!value.startsWith('https://')))throw new EnvironmentConfigurationError('Production CORS_ORIGINS must contain HTTPS origins and cannot use a wildcard.');return[...new Set(values.map(value=>url(value,'CORS_ORIGINS entry',environment==='production')))];}
function googleRedirectUri(value:string,environment:AppEnvironment){
  let parsed:URL;try{parsed=new URL(value);}catch{throw new EnvironmentConfigurationError('GOOGLE_REDIRECT_URI must be a valid URL.');}
  if(parsed.pathname!==googleOAuthCallbackPath||parsed.search||parsed.hash||parsed.username||parsed.password)throw new EnvironmentConfigurationError(`GOOGLE_REDIRECT_URI must use the exact ${googleOAuthCallbackPath} callback path without credentials, query parameters, or fragments.`);
  if(environment==='development'||environment==='test'){
    if(parsed.protocol!=='http:'||parsed.hostname!=='localhost'||parsed.port!=='4000')throw new EnvironmentConfigurationError('Development and test GOOGLE_REDIRECT_URI must use the localhost HTTP callback on port 4000.');
  }else if(parsed.protocol!=='https:'||parsed.port||!productionGoogleOAuthHosts.has(parsed.hostname))throw new EnvironmentConfigurationError('Staging and production GOOGLE_REDIRECT_URI must use HTTPS on an approved NIAGANTARA API host.');
  return parsed.toString();
}
export function validateServerEnvironment(source:NodeJS.ProcessEnv=process.env):ServerEnvironment{
  const appEnv=appEnvironment(source);const googleValues=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REDIRECT_URI','GOOGLE_TOKEN_ENCRYPTION_KEY'].map(name=>source[name]?.trim());
  if(appEnv==='production'&&!googleValues.every(Boolean))throw new EnvironmentConfigurationError('Production requires complete Google OAuth configuration.');
  if(googleValues.some(Boolean)&&!googleValues.every(Boolean))throw new EnvironmentConfigurationError('Google OAuth configuration must be provided as a complete set.');
  if(googleValues[3]&&googleValues[3].length<32)throw new EnvironmentConfigurationError('GOOGLE_TOKEN_ENCRYPTION_KEY must contain at least 32 characters.');
  if(googleValues[2])googleValues[2]=googleRedirectUri(googleValues[2],appEnv);
  if(appEnv==='production'&&(!source.APP_VERSION?.trim()||!source.BUILD_SHA?.trim()))throw new EnvironmentConfigurationError('Production requires APP_VERSION and BUILD_SHA.');
  return{nodeEnv:source.NODE_ENV?.trim()||appEnv,appEnv,appVersion:source.APP_VERSION?.trim()||'0.1.0',buildSha:source.BUILD_SHA?.trim()||'local',serviceName:'niagantara-api',supabaseUrl:url(required(source,'SUPABASE_URL'),'SUPABASE_URL'),supabaseAnonKey:required(source,'SUPABASE_ANON_KEY'),supabaseServiceRoleKey:required(source,'SUPABASE_SERVICE_ROLE_KEY'),host:source.HOST?.trim()||'0.0.0.0',port:integer(source,'PORT',4000,1,65535),corsOrigins:origins(source,appEnv),trustProxy:boolean(source,'TRUST_PROXY',appEnv!=='development'),bodyLimitBytes:integer(source,'BODY_LIMIT_BYTES',1_048_576,16_384,10_485_760),requestTimeoutMs:integer(source,'REQUEST_TIMEOUT_MS',30_000,1_000,120_000),googleTimeoutMs:integer(source,'GOOGLE_API_TIMEOUT_MS',15_000,1_000,60_000),rateLimitWindowMs:integer(source,'RATE_LIMIT_WINDOW_MS',60_000,1_000,3_600_000),rateLimitDefault:integer(source,'RATE_LIMIT_DEFAULT',120,1,10_000),googleClientId:googleValues[0],googleClientSecret:googleValues[1],googleRedirectUri:googleValues[2],googleTokenEncryptionKey:googleValues[3],logLevel:source.LOG_LEVEL?.trim()||(appEnv==='production'?'log':'debug')};
}
export const expectedProductionOrigins=()=>[...productionOrigins];
