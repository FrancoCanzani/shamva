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
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </Section>

            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Monitor Alert: <strong>{monitorName}</strong> is Down
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Hello {userName},
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              We've detected that your monitor <strong>{monitorName}</strong> is
              currently experiencing issues.
            </Text>

            <Section className="bg-gray-50 rounded-lg p-4 my-4">
              <Text className="text-black text-[14px] leading-[24px] m-0 mb-2">
                <strong>URL:</strong> {url}
              </Text>
              <Text className="text-black text-[14px] leading-[24px] m-0 mb-2">
                <strong>Status:</strong>{" "}
                {statusCode ? `HTTP ${statusCode}` : "Connection Failed"}
              </Text>
              <Text className="text-black text-[14px] leading-[24px] m-0 mb-2">
                <strong>Error:</strong> {errorMessage}
              </Text>
              <Text className="text-black text-[14px] leading-[24px] m-0 mb-2">
                <strong>Last Checked:</strong> {formattedDate}
              </Text>
              {region && (
                <Text className="text-black text-[14px] leading-[24px] m-0">
                  <strong>Region:</strong> {region}
                </Text>
              )}
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              We'll continue monitoring and notify you when the service is
              restored.
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Link
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3 inline-block"
                href={dashboardUrl}
              >
                View Dashboard
              </Link>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
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
