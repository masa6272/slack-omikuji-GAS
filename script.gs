// AppのVerification Token
const VERIFICATION_TOKEN = PropertiesService.getScriptProperties().getProperty('TOKEN');

// 0からmax-1までの整数を返す
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function swap(a,x,y){
  let temp=a[x];
  a[x]=a[y];
  a[y]=temp;
}

function doPost(e){
  // 対象のSlackアプリ以外から呼び出されたらエラーを出す
  if (e.parameter.token != VERIFICATION_TOKEN) { 
    throw new Error('Invalid token');
  }
  
  let text=e.parameter.text;
  if(text.length===0){
    let error_zeroargs='【エラー】当たりの数と選択肢を入力してください。';
    return ContentService.createTextOutput(error_zeroargs); 
  }

  // コメント部分を捨てる
  let commentStart = text.indexOf("#")
  if(commentStart != -1){
    text = text.substring(0, commentStart).trim();
  }

  // 抽選対象を配列に
  // 連続した文字の塊をとりだす。[1]~[num_all]がデータ
  var array = text.split(/[,，\s]+/);

  // 全角文字チェック
  if (array[0].match(/^[^\x01-\x7E\xA1-\xDF]+$/)) {      
    //全角文字
    let res='【エラー】当たりの数は半角数字で入力して下さい。入力は以下の通りでした。\n/select '+text;
    return ContentService.createTextOutput(res);
  }

  // 当たり数が数値かチェック
  if(isNaN(array[0])){
    let res='【エラー】"/select" の直後には当たり数を半角数字で入力してください。入力は以下の通りでした。\n/select '+text;
    return ContentService.createTextOutput(res);
  }

  let num_winners=Number(array[0]);
  let num_all=array.length-1;
  
  // 自然数かどうかチェック
  if(!(num_winners>0&&Number.isInteger(num_winners))){
    let res='【エラー】当たり数は正の整数を入力してください。入力は以下の通りでした。\n/select '+text;
    return ContentService.createTextOutput(res);
  }
  // 問題ない値かどうか
  if(num_winners>num_all){
    let error_tooMuchWinners='【エラー】当たりの数が多すぎます。入力は以下の通りでした。\n';
    error_tooMuchWinners+='/select '+text+'\n';
    error_tooMuchWinners+='当たりの数:'+num_winners+' 選択肢の数:'+num_all+'\n';

    return ContentService.createTextOutput(error_tooMuchWinners);
  }

  // ランダムな順列(0~num_all-1)をつくる
  let randomArray=[];

  for(let i=0;i<num_all;i++){
    randomArray.push(i);
  }
  for(let i=0;i<num_all;i++){
    let j=getRandomInt(num_all);
    swap(randomArray,i,j);
  }

  // ランダムにシャッフルした順列のうち、target番目からnum個選ぶ
  let target=getRandomInt(num_all);

  // 結果出力の文を生成
  let result = '抽選結果（当選数 '+num_winners+'/'+num_all+'）\n';

  for(let i=0; i < num_winners; i++){
    let next=array[randomArray[target]%num_all +1];
    result=result + next +'\n';   
    target=(target+1)%num_all;
  }

  Logger.log(result);

  // JSONも少しいじる
  const response={
    "text":result,
    "response_type":"in_channel"
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);

}
