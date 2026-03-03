import { beforeEach } from "vitest";
import { losService } from "@/lib/los-service";

process.env.LOS_DATA_MODE = "mock";
process.env.LOS_TIMEZONE = "Australia/Melbourne";
process.env.LOS_LOCALE = "en-AU";
process.env.LOS_CURRENCY = "AUD";

beforeEach(() => {
  losService.resetMockData();
});
