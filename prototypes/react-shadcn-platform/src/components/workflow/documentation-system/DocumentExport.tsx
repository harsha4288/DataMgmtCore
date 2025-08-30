/**
 * Document Export - Export functionality for different formats
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileText,
  Code,
  Globe,
  FileJson,
  Printer,
  Copy,
  Check
} from 'lucide-react';

interface DocumentExportProps {
  content: string;
  title: string;
  format: 'markdown' | 'html' | 'json' | 'pdf' | 'txt';
}

type ExportFormat = 'markdown' | 'html' | 'json' | 'pdf' | 'txt';

interface ExportOptions {
  includeMetadata: boolean;
  includeTimestamp: boolean;
  minifyOutput: boolean;
  addTableOfContents: boolean;
}

export const DocumentExport: React.FC<DocumentExportProps> = ({
  content,
  title,
  format: initialFormat
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(initialFormat);
  const [options, setOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includeTimestamp: true,
    minifyOutput: false,
    addTableOfContents: false
  });
  const [copied, setCopied] = useState(false);

  const formatOptions = [
    {
      value: 'markdown',
      label: 'Markdown',
      icon: <FileText className="h-4 w-4" />,
      description: 'Standard Markdown format (.md)',
      extension: '.md'
    },
    {
      value: 'html',
      label: 'HTML',
      icon: <Globe className="h-4 w-4" />,
      description: 'Web-ready HTML format (.html)',
      extension: '.html'
    },
    {
      value: 'json',
      label: 'JSON',
      icon: <FileJson className="h-4 w-4" />,
      description: 'Structured JSON format (.json)',
      extension: '.json'
    },
    {
      value: 'txt',
      label: 'Plain Text',
      icon: <FileText className="h-4 w-4" />,
      description: 'Simple text format (.txt)',
      extension: '.txt'
    },
    {
      value: 'pdf',
      label: 'PDF',
      icon: <Printer className="h-4 w-4" />,
      description: 'Printable PDF format (.pdf)',
      extension: '.pdf'
    }
  ];

  const generateExportContent = (): string => {
    const timestamp = new Date().toISOString();
    const metadata = {
      title,
      exportedAt: timestamp,
      format: selectedFormat,
      contentLength: content.length
    };

    switch (selectedFormat) {
      case 'markdown':
        let mdContent = content;
        if (options.includeMetadata) {
          mdContent = `---\ntitle: "${title}"\nexportedAt: "${timestamp}"\nformat: "markdown"\n---\n\n${mdContent}`;
        }
        if (options.addTableOfContents) {
          const toc = generateTableOfContents(content);
          mdContent = `${options.includeMetadata ? mdContent.split('\n\n')[0] + '\n\n' : ''}${toc}\n\n${content}`;
        }
        return mdContent;

      case 'html':
        const htmlContent = convertMarkdownToHtml(content);
        let fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 2rem; 
        }
        h1, h2, h3, h4, h5, h6 { margin-top: 2rem; margin-bottom: 1rem; }
        code { 
            background-color: #f4f4f4; 
            padding: 0.2rem 0.4rem; 
            border-radius: 3px; 
            font-family: 'Courier New', monospace; 
        }
        pre { 
            background-color: #f4f4f4; 
            padding: 1rem; 
            border-radius: 5px; 
            overflow-x: auto; 
        }
    </style>
</head>
<body>
    ${options.includeMetadata ? `<div style="border-bottom: 1px solid #eee; margin-bottom: 2rem; padding-bottom: 1rem;">
        <small>Exported: ${timestamp} | Format: HTML</small>
    </div>` : ''}
    ${htmlContent}
</body>
</html>`;
        return options.minifyOutput ? fullHtml.replace(/\s+/g, ' ').trim() : fullHtml;

      case 'json':
        const jsonData = {
          ...(options.includeMetadata && metadata),
          content: content,
          sections: parseContentSections(content),
          wordCount: content.trim().split(/\s+/).length,
          lineCount: content.split('\n').length
        };
        return JSON.stringify(jsonData, null, options.minifyOutput ? 0 : 2);

      case 'txt':
        let txtContent = content.replace(/#{1,6}\s+([^\n]+)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
        if (options.includeMetadata) {
          txtContent = `${title}\nExported: ${timestamp}\n\n${txtContent}`;
        }
        return txtContent;

      case 'pdf':
        return 'PDF export requires server-side processing. Use the download button to generate PDF.';

      default:
        return content;
    }
  };

  const generateTableOfContents = (text: string): string => {
    const headers = text.match(/#{1,6}\s+[^\n]+/g) || [];
    if (headers.length === 0) return '';

    let toc = '## Table of Contents\n\n';
    headers.forEach((header) => {
      const level = header.match(/^#{1,6}/)?.[0].length || 1;
      const title = header.replace(/^#{1,6}\s+/, '');
      const indent = '  '.repeat(Math.max(0, level - 1));
      const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      toc += `${indent}- [${title}](#${anchor})\n`;
    });

    return toc;
  };

  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/#{6}\s+([^\n]+)/g, '<h6>$1</h6>')
      .replace(/#{5}\s+([^\n]+)/g, '<h5>$1</h5>')
      .replace(/#{4}\s+([^\n]+)/g, '<h4>$1</h4>')
      .replace(/#{3}\s+([^\n]+)/g, '<h3>$1</h3>')
      .replace(/#{2}\s+([^\n]+)/g, '<h2>$1</h2>')
      .replace(/#{1}\s+([^\n]+)/g, '<h1>$1</h1>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^\* (.+)/gm, '<li>$1</li>')
      .replace(/^- (.+)/gm, '<li>$1</li>')
      .replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/, '<p>$1</p>');
  };

  const parseContentSections = (text: string) => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection: any = null;

    lines.forEach((line) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2],
          content: ''
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const handleDownload = () => {
    const exportContent = generateExportContent();
    const selectedOption = formatOptions.find(f => f.value === selectedFormat);
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}${selectedOption?.extension || '.txt'}`;
    
    if (selectedFormat === 'pdf') {
      // For PDF, we would need server-side processing
      alert('PDF export requires server-side processing. This would typically integrate with a PDF generation service.');
      return;
    }

    const blob = new Blob([exportContent], { 
      type: selectedFormat === 'html' ? 'text/html' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const exportContent = generateExportContent();
    navigator.clipboard.writeText(exportContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const selectedOption = formatOptions.find(f => f.value === selectedFormat);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Document
          </CardTitle>
          <CardDescription>
            Export "{title}" in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <Select value={selectedFormat} onValueChange={(value: ExportFormat) => setSelectedFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex items-center gap-2">
                      {format.icon}
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-muted-foreground">{format.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Export Options */}
          <div>
            <label className="text-sm font-medium mb-3 block">Export Options</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeMetadata: checked as boolean }))
                  }
                />
                <label htmlFor="metadata" className="text-sm">Include metadata</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamp"
                  checked={options.includeTimestamp}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeTimestamp: checked as boolean }))
                  }
                />
                <label htmlFor="timestamp" className="text-sm">Include timestamp</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="toc"
                  checked={options.addTableOfContents}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, addTableOfContents: checked as boolean }))
                  }
                  disabled={selectedFormat === 'txt' || selectedFormat === 'json'}
                />
                <label htmlFor="toc" className="text-sm">Add table of contents</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minify"
                  checked={options.minifyOutput}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, minifyOutput: checked as boolean }))
                  }
                  disabled={selectedFormat === 'txt'}
                />
                <label htmlFor="minify" className="text-sm">Minify output</label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div>
            <label className="text-sm font-medium mb-2 block">Preview</label>
            <div className="bg-muted p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs">
                {generateExportContent().substring(0, 300)}
                {generateExportContent().length > 300 && '...'}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download {selectedOption?.label}
            </Button>
            <Button variant="outline" onClick={handleCopyToClipboard}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          {/* File Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex justify-between">
              <span>File size: {new Blob([generateExportContent()]).size} bytes</span>
              <span>Format: {selectedOption?.extension}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};