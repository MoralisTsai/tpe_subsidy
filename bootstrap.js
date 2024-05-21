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
      `${subsidy.appName} -> 申請人身份證字號 | 性別 | 出生日期 | 聯絡電話`
    );

    const [appId, appSex, appBir, appTel] = additional.split(" ");

    $("#app_id").val(appId);
    $("#app_sex").val(
      {
        M: 1,
        F: 2,
      }[appSex]
    );

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
      `${subsidy.appName}(${subsidy.careName}) -> 申請日期 | 申請金額 | 醫院`
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
        ["健順永豐", ["財團法人台灣省私立健順養護中心", "17800100011772"]],
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
      $("#seh_bank_no").val("郵局");
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
      "Unable to retrieve account ID. Please ensure that the `care.account` follows the format."
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
