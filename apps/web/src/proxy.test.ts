import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("proxy auth gate", () => {
  it("redirects unauthenticated requests to unlock and preserves the destination", () => {
    process.env.LOS_DASHBOARD_PIN = "1999";

    const request = new NextRequest("http://localhost/projects?status=ACTIVE");
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/unlock?next=%2Fprojects%3Fstatus%3DACTIVE");
  });

  it("allows authenticated requests through", () => {
    process.env.LOS_DASHBOARD_PIN = "1999";

    const request = new NextRequest("http://localhost/projects", {
      headers: { cookie: "los_auth=1" },
    });
    const response = proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects authenticated users away from unlock to their requested destination", () => {
    process.env.LOS_DASHBOARD_PIN = "1999";

    const request = new NextRequest("http://localhost/unlock?next=%2Ffocus", {
      headers: { cookie: "los_auth=1" },
    });
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/focus");
  });

  it("ignores external redirect targets", () => {
    process.env.LOS_DASHBOARD_PIN = "1999";

    const request = new NextRequest("http://localhost/unlock?next=https://example.com", {
      headers: { cookie: "los_auth=1" },
    });
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("allows the unlock API route to pass through", () => {
    process.env.LOS_DASHBOARD_PIN = "1999";

    const request = new NextRequest("http://localhost/api/auth/unlock");
    const response = proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
