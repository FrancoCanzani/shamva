import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface MonitorDownEmailProps {
  monitorName: string;
  url: string;
  userName?: string;
  statusCode?: number;
  errorMessage?: string;
  lastChecked: string;
  region?: string;
  dashboardUrl?: string;
}

export const MonitorDownEmail = ({
  monitorName = "Your Monitor",
  url = "https://example.com",
  userName = "there",
  statusCode,
  errorMessage = "Connection failed",
  lastChecked = new Date().toISOString(),
  region,
  dashboardUrl = "https://shamva.io/dashboard",
}: MonitorDownEmailProps) => {
  const previewText = `${monitorName} is currently down`;
  const formattedDate = new Date(lastChecked).toLocaleString();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]">
              <div className="mb-4 flex h-8 w-8 items-center justify-center bg-red-500">
                <span className="text-sm font-bold text-white">!</span>
              </div>
            </Section>

            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Monitor Alert: <strong>{monitorName}</strong> is Down
            </Heading>

            <Text className="text-[14px] leading-[24px] text-black">
              Hello {userName},
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              We've detected that your monitor <strong>{monitorName}</strong> is
              currently experiencing issues.
            </Text>

            <Section className="my-4 bg-gray-50 p-4">
              <Text className="m-0 mb-2 text-[14px] leading-[24px] text-black">
                <strong>URL:</strong> {url}
              </Text>
              <Text className="m-0 mb-2 text-[14px] leading-[24px] text-black">
                <strong>Status:</strong>{" "}
                {statusCode ? `HTTP ${statusCode}` : "Connection Failed"}
              </Text>
              <Text className="m-0 mb-2 text-[14px] leading-[24px] text-black">
                <strong>Error:</strong> {errorMessage}
              </Text>
              <Text className="m-0 mb-2 text-[14px] leading-[24px] text-black">
                <strong>Last Checked:</strong> {formattedDate}
              </Text>
              {region && (
                <Text className="m-0 text-[14px] leading-[24px] text-black">
                  <strong>Region:</strong> {region}
                </Text>
              )}
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              We'll continue monitoring and notify you when the service is
              restored.
            </Text>

            <Section className="mt-[32px] mb-[32px] text-center">
              <Link
                className="inline-block bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={dashboardUrl}
              >
                View Dashboard
              </Link>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              Best regards,
              <br />
              The Shamva Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
