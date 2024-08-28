window.tpe = {};

window.tpe.accounts = [];

window.tpe.set = function set(value) {
  window.tpe.index = value;
};

window.tpe.log = function log() {
  console.group("Execution detail: ");
  console.log("Current index: ", window.tpe.index);
  console.log("Name: ", window.tpe.subsidies[window.tpe.index]?.appName);
  console.log("Accounts: ", window.tpe.accounts);
  console.groupEnd();
};

window.tpe.boot = function boot(values) {
  window.tpe.index = 0;
  window.tpe.subsidies = values;
};

window.tpe.next = async function next() {
  if (window.tpe.index > window.tpe.subsidies.length - 1) {
    console.group("Congratulation! All date has been created");
    console.log("Total: ", window.tpe.index);
    console.log("Accounts: ", window.tpe.accounts);
    console.groupEnd();
    return;
  }

  const subsidy = window.tpe.subsidies[window.tpe.index];

  const user = await checkUserAvailability(subsidy.appName);

  if (user == null) {
    return;
  }

  const __changeSearch = changeSearch;
  __changeSearch(user.app_no, user.app_id, user.app_name);

  setTimeout(async function () {
    window.tpe.inject();
  }, 1000);

  async function checkUserAvailability(value) {
    $("#app_name").val(value);

    const response = await $.ajax({
      url: "https://sw.gov.taipei/M24_T211_001/GetApplyList",
      type: "POST",
      data: {
        app_name: value,
      },
    });

    if (Array.isArray(response) && response.length === 0) {
      manualUserDetail();

      return Promise.resolve(null);
    }

    if (Array.isArray(response) && response.length > 1) {
      throw Error("Received more than one user with the same name");
    }

    return response[0];
  }

  function manualUserDetail() {
    const additional = window.prompt(
      `${subsidy.appName} -> 申請人身份證字號 | 出生日期 | 聯絡電話`,
    );

    const [appId, appBir, appTel] = additional.split(" ");
    const appSex = typeof appId === 'string' ? appId.slice(1,2) : 1;

    $("#app_id").val(appId);
    $('#app_sex").val(appSex);

    $("#app_bir").val(literalDateConverter(appBir));
    $("#app_bir").trigger("blur");

    $("#app_tel").val(appTel);
  }
};

window.tpe.push = function push() {
  const subsidy = window.tpe.subsidies[window.tpe.index];

  window.tpe.accounts.push({
    applicant: subsidy.appName,
    short: subsidy.account,
    full: $("#bank_no option:selected").text(),
    name: $("#acc_name").val(),
    no: $("#acc_no").val(),
  });

  window.tpe.index += 1;

  const __clearSearchBtn = clearSearchBtn;
  __clearSearchBtn();
};

window.tpe.inject = function inject() {
  const subsidy = window.tpe.subsidies[window.tpe.index];

  $("#agr_date").val(subsidy.agrDate.replaceAll(".", "/"));
  $("#seh_co_desc2").val(subsidy.coNo);
  $("#seh_co_desc2").trigger("blur");
  $("#hos_date1").val(dateParser(subsidy.hosDate1));
  $("#hos_date2").val(dateParser(subsidy.hosDate2));
  $("#agr_money").val(subsidy.agrMoney);
  $("#hos_day").val(Math.round(subsidy.hosDay));
  $("#mny_no").val(accountIDParser(subsidy.account));
  $("#care_name").val(subsidy.careName);
  $("#care_id").val(subsidy.careId);

  retrieveAccount(subsidy.account);

  manualInputHandler();

  function manualInputHandler() {
    const additional = window.prompt(
      `${subsidy.appName}(${subsidy.careName}) -> 申請日期 | 申請金額 | 醫院`,
    );
    const [appDate, appMoney, appHospital] = additional.split(" ");

    $("#app_date").val(literalDateConverter(appDate));
    $("#app_money").val(appMoney);

    $("#seh_hos_no").val(appHospital);
    $("#seh_hos_no").trigger("blur");
  }

  function retrieveAccount(rawAccount) {
    const accountType = convertToNumber(rawAccount.slice(0, 1));

    if ([1, 2, 3].includes(accountType)) {
      const commonAccount = new Map([
        ["仁光國泰", ["有限責任臺北市仁光照顧服務勞動合作社", "020035000349"]],
        ["仁光合庫", ["有限責任臺北市仁光照顧服務勞動合作社", "1427717001696"]],
        ["仁愛富邦", ["有限責任台北市仁愛照顧服務勞動合作社", "370102146648"]],
        ["侒侒中信", ["侒侒有限公司", "266540264467"]],
        ["侒侒合庫", ["侒侒有限公司", "0981717826575"]],
        ["慈愛富邦", ["慈愛服務有限公司", "701102009531"]],
        ["龍祥龍潭", ["私立龍祥精神護理之家", "77104010034950"]],
        ["松湛園合庫", ["台北市私立松湛園老人養護所", "0020717396783"]],
        ["承康土地", ["私立承康護理之家", "080001023873"]],
        ["慈濟兆豐", ["佛教慈濟醫療財團法人台北慈濟醫院", "06909080007"]],
        ["腦麻華南", ["社團法人中華民國腦性麻痺協會", "189100022031"]],
        ["健順永豐", ["財團法人臺灣省私立健順養護中心", "17800100011772"]],
        ["博仁玉山", ["博仁綜合醫院", "0912440003677"]],
        ["恩光合庫", ["恩光服務股份有限公司", "1391717211432"]],
        ["同仁台企", ["八里同仁護理之家", "11112028813"]],
        ["景馨台企", ["新北市私立景馨護理之家陳素琦", "02612675727"]],
        ["祥閎中信", ["祥閎管理顧問企業社", "819540207790"]],
        ["同仁土城", ["同仁醫院附設土城護理之家", "77504011003355"]],
        ["和樂中信", ["和樂照服企業社", "657540101252"]],
        ["福德永豐", ["福德護理之家", "12701800123498"]],
        ["東明華南", ["臺北市東明扶愛家園", "113100158419"]],
        ["健安土地", ["健安管理顧問企業社", "004001151342"]],
        ["宜蘭第一", ["衛生福利部社會及家庭署宜蘭教養院", "15350360016"]],
        ["惠群兆豐", ["惠群護理之家周惠貞", "20609020005"]],
        ["明美合庫", ["明美照服有限公司", "3568717809766"]],
        ["迦南郵局", ["迦南精神護理之家楊甄儀", "04013570142308"]],
        ["馨園臺企", ["財團法人新北市私立馨園老人養護中心", "07012069906"]],
        ["德安合庫", ["社團法人台灣德安社會福利協會", "5034717357337"]],
        ["樺新富邦", ["樺新管理顧問企業社", "221102008940"]],
        ["天恩彰化", ["臺北市私立天恩老人長期照顧中心(養護型)薛綉娥", "51300151911700"]],
        ["永順合庫", ["新北市私立永順老人養護中心", "1449717720807"]],
        ["同心土城", ["新北市私立同心老人長期照顧中心(養護型)", "77504010000261"]],
        ["松青合庫", ["台北市私立松青園老人養護所", "0020717396775"]],
        ["隆泰中信", ["隆泰護理之家", "186540124797"]],
        ["新常安永豐", ["臺北市私立新常安老人長期照顧中心(養護型)", "16200100081933"]],
        ["萬芳永豐", ["臺北市立萬芳醫院-委託臺北醫學大學辦理", "10600401000332"]],
        [
          "仁光富邦",
          ["有限責任臺北市仁光照顧服務勞動合作社 林淑絹", "370102145900"],
        ],
        [
          "荷園遠東",
          ["臺北市私立荷園老人長期照顧中心(養護型)", "00900100012402"],
        ],
        [
          "全泰臺灣",
          ["臺北市私立全泰老人長期照顧中心(養護型)陳莉茵", "142001009994"],
        ],
        [
          "榮祥富邦",
          ["臺北市私立榮祥老人長期照顧中心(養護型)", "361102007347"],
        ],
        [
          "倚青富邦",
          [
            "臺北市私立倚青苑老人長期照顧中心（養護型）江國華",
            "82120000023730",
          ],
        ],
        [
          "上美彰化",
          ["臺北市私立上美老人長期照顧中心（養護型）李依蓮", "98320101606300"],
        ],
        [
          "仁群永豐",
          ["臺北市私立仁群老人長期照顧中心(養護型)劉昱森", "14801800071655"],
        ],
        [
          "傅英彰化",
          ["新北市私立傅英老人長期照顧中心（養護型）張鎮育", "56090101130500"],
        ],
        [
          "聖安兆豐",
          [
            "財團法人天主教白永恩神父社會福利基金會附設臺北市私立聖安娜之家",
            "02109010310",
          ],
        ],
        [
          "倚青華泰",
          ["臺北市私立倚青園老人長期照顧中心(養護型)劉昱森", "1703000012102"],
        ],
        [
          "同心農會",
          ["新北市私立同心老人長期照顧中心(養護型)", "77504010000261"],
        ],
      ]);

      const accountDetail = rawAccount.slice(1, 5);
      const shouldAutoInject = commonAccount.has(accountDetail);

      if (shouldAutoInject) {
        const [fullName, fullAccount] = commonAccount.get(accountDetail);

        $("#divSettingForm").find("#acc_name").val(fullName);
        $("#divSettingForm").find("#acc_no").val(fullAccount);
      }

      $("#seh_bank_no").val(rawAccount.slice(-2));
      $("#seh_bank_no").trigger("blur");
    }

    if ([4, 5, 6].includes(accountType)) {
      $("#seh_bank_no").val("郵局郵政儲金匯業局");
      $("#seh_bank_no").trigger("blur");

      $("#divSettingForm").find("#acc_name").val(rawAccount.slice(1));
    }
  }
};

function dateParser(value) {
  if (typeof value !== "string") {
    throw Error("invalid date value is passed, received: ", value);
  }

  return value.replaceAll(".", "/").substring(0, 9);
}

function accountIDParser(value) {
  const index = convertToNumber(value.slice(0, 1));

  const ACCOUNT_ID = ["C001", "C002", "C003", "C004", "C005", "C006"];

  return ACCOUNT_ID[index - 1];
}

function convertToNumber(value) {
  const result = Number(value);

  if (Number.isNaN(result)) {
    throw Error(
      "Unable to retrieve account ID. Please ensure that the `care.account` follows the format.",
    );
  }

  return result;
}

function literalDateConverter(value) {
  const year = value.slice(0, 3);
  const month = value.slice(3, 5);
  const day = value.slice(5);

  return `${year}/${month}/${day}`;
}
