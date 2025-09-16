import {
  ArrowUpRight,
  FileText,
  Github,
  Keyboard,
  MessageSquare,
  Zap,
} from "lucide-react";
import { FeedbackForm } from "./feedback-form";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function HelpDropdown() {
  const handleShowKeyboardShortcuts = () => {
    console.log("Show keyboard shortcuts modal");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-8 rounded-full px-0">
          ?<span className="sr-only">Help</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="center">
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-xs"
            onClick={handleShowKeyboardShortcuts}
          >
            <Keyboard className="mr-2 h-3 w-3" />
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-xs">
            <a
              href="https://docs.shamva.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="mr-2 h-3 w-3" />
              Docs
              <ArrowUpRight className="ml-auto h-3 w-3" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-xs">
            <a
              href="https://docs.shamva.com/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Zap className="mr-2 h-3 w-3" />
              API Docs
              <ArrowUpRight className="ml-auto h-3 w-3" />
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="text-xs">
            <a
              href="https://github.com/shamva/shamva"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-3 w-3" />
              GitHub
              <ArrowUpRight className="ml-auto h-3 w-3" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-xs">
            <a
              href="https://github.com/shamva/shamva/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageSquare className="mr-2 h-3 w-3" />
              GitHub Issues
              <ArrowUpRight className="ml-auto h-3 w-3" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-xs">
            <a
              href="https://github.com/shamva/shamva/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="mr-2 h-3 w-3" />
              Changelog
              <ArrowUpRight className="ml-auto h-3 w-3" />
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <FeedbackForm />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
