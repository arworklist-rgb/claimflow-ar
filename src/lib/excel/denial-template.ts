import { DENIAL_CODE_COLUMNS } from "./columns";
import { buildWorkbookFile, downloadFile } from "./write";

/** Two columns, "Denial Code | Description", with a couple of examples from the client's list. */
export async function downloadDenialCodeTemplate() {
  const file = await buildWorkbookFile(
    "denial_codes_template.xlsx",
    "Denial Codes",
    DENIAL_CODE_COLUMNS,
    [
      ["16", "Claim/service lacks information or has submission/billing error(s)."],
      ["197", "Precertification/authorization/notification/pre-treatment absent."],
    ],
    [14, 80],
  );
  downloadFile(file);
}
