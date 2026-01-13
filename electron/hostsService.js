const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CommandStack {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  push(command) {
    this.undoStack.push(command);
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return null;
    const command = this.undoStack.pop();
    this.redoStack.push(command);
    return command;
  }

  redo() {
    if (this.redoStack.length === 0) return null;
    const command = this.redoStack.pop();
    this.undoStack.push(command);
    return command;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

class HostsService {
  constructor(hostsPath) {
    this.hostsPath = hostsPath;
    this.backupDir = path.join(process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData\\Roaming'), 'hosts-manager', 'backups');
    this.commandStack = new CommandStack();
    this.originalHosts = [];
  }

  async initialize() {
    try {
      if (!fs.existsSync(this.hostsPath)) {
        return { success: false, error: 'Hosts文件不存在', details: `路径: ${this.hostsPath}` };
      }

      const readResult = await this.readHostsFile();
      if (!readResult.success) {
        return readResult;
      }

      this.originalHosts = [...readResult.hosts];

      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: '初始化失败', details: error.message };
    }
  }

  parseHostsFile(content) {
    const hosts = [];
    const lines = content.split('\n');
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmedLine = line.trim();

      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
        if (trimmedLine.startsWith('#')) {
          hosts.push({
            id: `line-${lineNumber}`,
            ip: '',
            domain: '',
            comment: trimmedLine,
            isComment: true,
            lineNumber: lineNumber
          });
        }
        continue;
      }

      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const ip = parts[0];
        const domains = parts.slice(1);
        const commentIndex = domains.findIndex(d => d.startsWith('#'));

        if (commentIndex !== -1) {
          const domainList = domains.slice(0, commentIndex);
          const commentParts = domains.slice(commentIndex);
          const comment = commentParts.join(' ');

          for (const domain of domainList) {
            hosts.push({
              id: `line-${lineNumber}-${domain}`,
              ip: ip,
              domain: domain,
              comment: comment,
              isComment: false,
              lineNumber: lineNumber
            });
          }
        } else {
          for (const domain of domains) {
            hosts.push({
              id: `line-${lineNumber}-${domain}`,
              ip: ip,
              domain: domain,
              comment: '',
              isComment: false,
              lineNumber: lineNumber
            });
          }
        }
      }
    }

    return hosts;
  }

  generateHostsContent(hosts) {
    const lines = [];
    const groupedByLine = {};

    for (const host of hosts) {
      if (!groupedByLine[host.lineNumber]) {
        groupedByLine[host.lineNumber] = { hosts: [], comment: '' };
      }
      if (!host.isComment) {
        groupedByLine[host.lineNumber].hosts.push(host);
      } else {
        groupedByLine[host.lineNumber].comment = host.comment;
      }
    }

    const sortedLineNumbers = Object.keys(groupedByLine)
      .map(Number)
      .sort((a, b) => a - b);

    for (const lineNumber of sortedLineNumbers) {
      const group = groupedByLine[lineNumber];
      
      if (group.comment) {
        lines.push(group.comment);
      }
      
      if (group.hosts.length > 0) {
        const ip = group.hosts[0].ip;
        const domains = group.hosts.map(h => h.domain).join(' ');
        const line = `${ip} ${domains}`;
        lines.push(line);
      }
    }

    return lines.join('\n');
  }

  async readHostsFile() {
    try {
      const content = fs.readFileSync(this.hostsPath, 'utf8');
      const hosts = this.parseHostsFile(content);
      return { success: true, hosts: hosts };
    } catch (error) {
      return { success: false, error: '读取Hosts文件失败', details: error.message };
    }
  }

  async writeHostsFile(hosts) {
    try {
      const content = this.generateHostsContent(hosts);
      fs.writeFileSync(this.hostsPath, content, 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: '写入Hosts文件失败', details: error.message };
    }
  }

  async getHosts() {
    return this.readHostsFile();
  }

  async addHost(host) {
    try {
      const readResult = await this.readHostsFile();
      if (!readResult.success) {
        return readResult;
      }

      const hosts = readResult.hosts;
      const maxLineNumber = Math.max(0, ...hosts.map(h => h.lineNumber));
      const newHost = {
        id: `new-${Date.now()}`,
        ip: host.ip,
        domain: host.domain,
        comment: host.comment || '',
        isComment: false,
        lineNumber: maxLineNumber + 1
      };

      const command = {
        type: 'ADD',
        host: newHost,
        execute: async () => {
          const result = await this.readHostsFile();
          if (!result.success) return result;
          
          const currentHosts = result.hosts;
          const updatedHost = { ...newHost, lineNumber: Math.max(0, ...currentHosts.map(h => h.lineNumber)) + 1 };
          currentHosts.push(updatedHost);
          
          return this.writeHostsFile(currentHosts);
        },
        rollback: async () => {
          const result = await this.readHostsFile();
          if (!result.success) return result;
          
          const filtered = result.hosts.filter(h => h.id !== newHost.id);
          return this.writeHostsFile(filtered);
        }
      };

      const result = await command.execute();
      if (result.success) {
        this.commandStack.push(command);
      }

      return result;
    } catch (error) {
      return { success: false, error: '添加失败', details: error.message };
    }
  }

  async updateHost(oldHost, newHost) {
    try {
      const readResult = await this.readHostsFile();
      if (!readResult.success) {
        return readResult;
      }

      const hosts = readResult.hosts;
      const index = hosts.findIndex(h => h.id === oldHost.id);

      if (index === -1) {
        return { success: false, error: '未找到要修改的记录' };
      }

      const command = {
        type: 'UPDATE',
        oldHost: { ...oldHost },
        newHost: { ...newHost },
        execute: async () => {
          const result = await this.readHostsFile();
          if (!result.success) return result;
          
          const idx = result.hosts.findIndex(h => h.id === oldHost.id);
          if (idx === -1) return { success: false, error: '未找到要修改的记录' };
          
          result.hosts[idx] = { ...result.hosts[idx], ...newHost };
          return this.writeHostsFile(result.hosts);
        },
        rollback: async () => {
          const result = await this.readHostsFile();
          if (!result.success) return result;
          
          const idx = result.hosts.findIndex(h => h.id === newHost.id);
          if (idx === -1) return { success: false, error: '未找到记录' };
          
          result.hosts[idx] = { ...result.hosts[idx], ...oldHost };
          return this.writeHostsFile(result.hosts);
        }
      };

      const result = await command.execute();
      if (result.success) {
        this.commandStack.push(command);
      }

      return result;
    } catch (error) {
      return { success: false, error: '修改失败', details: error.message };
    }
  }

  async deleteHost(host) {
    try {
      const readResult = await this.readHostsFile();
      if (!readResult.success) {
        return readResult;
      }

      const command = {
        type: 'DELETE',
        host: { ...host },
        execute: async () => {
          const result = await this.readHostsFile();
          if (!result.success) return result;
          
          const filtered = result.hosts.filter(h => h.id !== host.id);
          return this.writeHostsFile(filtered);
        },
        rollback: async () => {
          const result = await this.readHostsFile();
          if (!result.success) return result;
          
          result.hosts.push({ ...host });
          return this.writeHostsFile(result.hosts);
        }
      };

      const result = await command.execute();
      if (result.success) {
        this.commandStack.push(command);
      }

      return result;
    } catch (error) {
      return { success: false, error: '删除失败', details: error.message };
    }
  }

  async deleteHosts(hosts) {
    try {
      const readResult = await this.readHostsFile();
      if (!readResult.success) {
        return readResult;
      }

      const deletedHosts = [];
      const command = {
        type: 'DELETE_MULTIPLE',
        hosts: deletedHosts,
        execute: async () => {
          const result = await this.readHostsFile();
          if (!result.success) return result;
          
          const idsToDelete = new Set(hosts.map(h => h.id));
          deletedHosts.push(...result.hosts.filter(h => idsToDelete.has(h.id)));
          
          const filtered = result.hosts.filter(h => !idsToDelete.has(h.id));
          return this.writeHostsFile(filtered);
        },
        rollback: async () => {
          const result = await this.readHostsFile();
          if (!result.success) return result;
          
          result.hosts.push(...deletedHosts);
          return this.writeHostsFile(result.hosts);
        }
      };

      const result = await command.execute();
      if (result.success) {
        this.commandStack.push(command);
      }

      return result;
    } catch (error) {
      return { success: false, error: '批量删除失败', details: error.message };
    }
  }

  async undo() {
    try {
      const command = this.commandStack.undo();
      if (!command) {
        return { success: false, error: '没有可撤销的操作' };
      }

      const result = await command.rollback();
      if (!result.success) {
        this.commandStack.redo();
      }

      return result;
    } catch (error) {
      return { success: false, error: '撤销失败', details: error.message };
    }
  }

  async redo() {
    try {
      const command = this.commandStack.redo();
      if (!command) {
        return { success: false, error: '没有可重做的操作' };
      }

      const result = await command.execute();
      if (!result.success) {
        this.commandStack.undo();
      }

      return result;
    } catch (error) {
      return { success: false, error: '重做失败', details: error.message };
    }
  }

  canUndo() {
    return this.commandStack.canUndo();
  }

  canRedo() {
    return this.commandStack.canRedo();
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `hosts-backup-${timestamp}.bak`);

      fs.writeFileSync(backupPath, fs.readFileSync(this.hostsPath, 'utf8'), 'utf8');

      return { success: true, backupPath: backupPath };
    } catch (error) {
      return { success: false, error: '创建备份失败', details: error.message };
    }
  }

  async restoreBackup(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: '备份文件不存在', details: backupPath };
      }

      const backupContent = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(this.hostsPath, backupContent, 'utf8');

      this.commandStack.clear();

      return { success: true };
    } catch (error) {
      return { success: false, error: '恢复备份失败', details: error.message };
    }
  }

  async getBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return { success: true, backups: [] };
      }

      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(f => f.startsWith('hosts-backup-') && f.endsWith('.bak'))
        .map(f => {
          const fullPath = path.join(this.backupDir, f);
          const stats = fs.statSync(fullPath);
          return {
            filename: f,
            path: fullPath,
            size: stats.size,
            created: stats.birthtime
          };
        })
        .sort((a, b) => b.created - a.created);

      return { success: true, backups: backups };
    } catch (error) {
      return { success: false, error: '获取备份列表失败', details: error.message };
    }
  }
}

module.exports = { HostsService };
