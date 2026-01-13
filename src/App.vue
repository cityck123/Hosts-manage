<template>
  <el-config-provider :locale="locale">
    <div class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <div class="header-left">
            <el-icon class="header-icon"><Monitor /></el-icon>
            <span class="header-title">Hosts文件管理器</span>
          </div>
          <div class="header-actions">
            <el-button-group>
              <el-tooltip content="撤销" placement="bottom">
                <el-button 
                  :icon="Bottom" 
                  :disabled="!canUndo"
                  @click="handleUndo"
                >撤销</el-button>
              </el-tooltip>
              <el-tooltip content="重做" placement="bottom">
                <el-button 
                  :icon="Top" 
                  :disabled="!canRedo"
                  @click="handleRedo"
                >重做</el-button>
              </el-tooltip>
            </el-button-group>
            <el-button-group>
              <el-tooltip content="打开Hosts文件" placement="bottom">
                <el-button :icon="FolderOpened" @click="openHostsFile">打开</el-button>
              </el-tooltip>
              <el-tooltip content="刷新" placement="bottom">
                <el-button :icon="Refresh" @click="refreshHosts">刷新</el-button>
              </el-tooltip>
            </el-button-group>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="main-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>Hosts记录列表</span>
                  <div class="header-buttons">
                    <el-input
                      v-model="searchText"
                      placeholder="搜索IP地址或域名"
                      :prefix-icon="Search"
                      clearable
                      style="width: 200px"
                      @input="handleSearch"
                    />
                    <el-button type="primary" :icon="Plus" @click="showAddDialog">添加记录</el-button>
                    <el-button 
                      type="danger" 
                      :icon="Delete" 
                      :disabled="selectedHosts.length === 0"
                      @click="handleBatchDelete"
                    >删除选中</el-button>
                  </div>
                </div>
              </template>
              
              <el-table
                :data="filteredHosts"
                style="width: 100%"
                stripe
                border
                @selection-change="handleSelectionChange"
                :row-class-name="getRowClassName"
              >
                <el-table-column type="selection" width="50" />
                <el-table-column prop="lineNumber" label="行号" width="80" sortable />
                <el-table-column prop="ip" label="IP地址" width="150">
                  <template #default="{ row }">
                    <el-input 
                      v-model="row.ip" 
                      size="small"
                      @blur="handleCellEdit(row, 'ip')"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="domain" label="域名" min-width="200">
                  <template #default="{ row }">
                    <el-input 
                      v-model="row.domain" 
                      size="small"
                      @blur="handleCellEdit(row, 'domain')"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="comment" label="注释" min-width="200">
                  <template #default="{ row }">
                    <el-input 
                      v-model="row.comment" 
                      size="small"
                      @blur="handleCellEdit(row, 'comment')"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button-group>
                      <el-tooltip content="编辑" placement="top">
                        <el-button type="primary" :icon="Edit" size="small" @click="editHost(row)" />
                      </el-tooltip>
                      <el-tooltip content="删除" placement="top">
                        <el-button type="danger" :icon="Delete" size="small" @click="deleteHost(row)" />
                      </el-tooltip>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="table-footer">
                <span>共 {{ hosts.length }} 条记录</span>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card class="backup-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>备份管理</span>
                  <el-button type="success" :icon="FolderAdd" @click="createBackup">创建备份</el-button>
                </div>
              </template>
              
              <el-table
                :data="backups"
                style="width: 100%"
                max-height="300"
                stripe
                @row-click="handleBackupClick"
              >
                <el-table-column prop="filename" label="备份文件" />
                <el-table-column prop="created" label="创建时间" width="160">
                  <template #default="{ row }">
                    {{ formatDate(row.created) }}
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="backup-actions">
                <el-button 
                  type="primary" 
                  :disabled="!selectedBackup"
                  @click="handleRestoreBackup"
                >恢复选中备份</el-button>
                <el-button 
                  type="info" 
                  :disabled="!selectedBackup"
                  @click="openBackupFolder"
                >打开备份文件夹</el-button>
              </div>
            </el-card>
            
            <el-card class="info-card" shadow="hover">
              <template #header>
                <span>使用说明</span>
              </template>
              <el-collapse>
                <el-collapse-item title="如何添加新记录？" name="1">
                  <p>点击"添加记录"按钮，在弹出的对话框中输入IP地址和域名，然后点击确定。</p>
                </el-collapse-item>
                <el-collapse-item title="如何编辑记录？" name="2">
                  <p>可以直接在表格中编辑IP、域名和注释，或双击记录进行编辑。</p>
                </el-collapse-item>
                <el-collapse-item title="如何删除记录？" name="3">
                  <p>选中要删除的记录，点击"删除选中"按钮，或点击单条记录后的删除按钮。</p>
                </el-collapse-item>
                <el-collapse-item title="关于备份" name="4">
                  <p>每次修改前会自动创建备份。您也可以手动创建备份，恢复到之前的某个版本。</p>
                </el-collapse-item>
              </el-collapse>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
      
      <el-dialog
        v-model="addDialogVisible"
        :title="editingHost ? '编辑记录' : '添加记录'"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form 
          ref="hostFormRef"
          :model="hostForm"
          :rules="hostRules"
          label-width="80px"
          status-icon
        >
          <el-form-item label="IP地址" prop="ip">
            <el-input 
              v-model="hostForm.ip" 
              placeholder="例如: 127.0.0.1"
              clearable
            />
          </el-form-item>
          <el-form-item label="域名" prop="domain">
            <el-input 
              v-model="hostForm.domain" 
              placeholder="例如: example.com"
              clearable
            />
          </el-form-item>
          <el-form-item label="注释">
            <el-input 
              v-model="hostForm.comment" 
              type="textarea"
              :rows="3"
              placeholder="可选，输入注释信息"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitHostForm">
            {{ editingHost ? '保存' : '添加' }}
          </el-button>
        </template>
      </el-dialog>
      
      <el-dialog
        v-model="confirmDialogVisible"
        title="确认删除"
        width="400px"
      >
        <div class="confirm-content">
          <el-icon class="warning-icon"><WarningFilled /></el-icon>
          <span>确定要删除选中的 {{ deleteCount }} 条记录吗？此操作不可撤销。</span>
        </div>
        <template #footer>
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </template>
      </el-dialog>
      
      <el-message-box />
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { 
  Monitor, FolderOpened, Refresh, Plus, Delete, Edit, 
  Bottom, Top, Search, FolderAdd, WarningFilled
} from '@element-plus/icons-vue';

const locale = zhCn;

const hosts = ref([]);
const backups = ref([]);
const selectedHosts = ref([]);
const selectedBackup = ref(null);
const searchText = ref('');

const addDialogVisible = ref(false);
const confirmDialogVisible = ref(false);
const deleteCount = ref(0);

const editingHost = ref(null);
const hostFormRef = ref(null);
const canUndo = ref(false);
const canRedo = ref(false);

const hostForm = reactive({
  ip: '',
  domain: '',
  comment: ''
});

const hostRules = {
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipv4Regex.test(value)) {
          callback(new Error('IP地址格式不正确'));
          return;
        }
        const parts = value.split('.');
        for (const part of parts) {
          const num = parseInt(part);
          if (num < 0 || num > 255) {
            callback(new Error('IP地址范围应在0-255之间'));
            return;
          }
        }
        callback();
      },
      trigger: 'blur'
    }
  ],
  domain: [
    { required: true, message: '请输入域名', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const domainRegex = /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+$/;
        const localhostRegex = /^(localhost|localhost\.localdomain)$/i;
        if (!domainRegex.test(value) && !localhostRegex.test(value)) {
          callback(new Error('域名格式不正确'));
          return;
        }
        if (value.length > 255) {
          callback(new Error('域名长度不能超过255个字符'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
};

const filteredHosts = computed(() => {
  if (!searchText.value) {
    return hosts.value;
  }
  const search = searchText.value.toLowerCase();
  return hosts.value.filter(host => 
    host.ip.toLowerCase().includes(search) || 
    host.domain.toLowerCase().includes(search) ||
    (host.comment && host.comment.toLowerCase().includes(search))
  );
});

async function loadHosts() {
  try {
    console.log('window.electronAPI:', window.electronAPI);
    if (!window.electronAPI) {
      ElMessage.error('无法连接到主进程，请尝试重新启动程序。如果问题持续，请检查是否以管理员权限运行。');
      return;
    }
    
    // 检查服务是否就绪
    if (window.electronAPI.isServiceReady) {
      const isReady = await window.electronAPI.isServiceReady();
      if (!isReady) {
        ElMessage.error('Hosts服务尚未初始化完成，请稍后重试');
        return;
      }
    }
    
    if (typeof window.electronAPI.getHosts !== 'function') {
      ElMessage.error('electronAPI.getHosts 方法不存在');
      return;
    }
    
    const result = await window.electronAPI.getHosts();
    if (result.success) {
      // 过滤掉注释行，只保留有效条目
      hosts.value = result.hosts.filter(host => !host.isComment);
    } else {
      ElMessage.error(result.error || '加载Hosts文件失败');
    }
  } catch (error) {
    ElMessage.error('加载Hosts文件时发生错误: ' + error.message);
    console.error('Full error:', error);
  }
}

async function loadBackups() {
  try {
    const result = await window.electronAPI.getBackups();
    if (result.success) {
      backups.value = result.backups;
    }
  } catch (error) {
    console.error('加载备份列表失败:', error);
  }
}

async function updateUndoRedoState() {
  canUndo.value = await window.electronAPI.canUndo();
  canRedo.value = await window.electronAPI.canRedo();
}

async function handleUndo() {
  try {
    const result = await window.electronAPI.undo();
    if (result.success) {
      ElMessage.success('撤销成功');
      await loadHosts();
      await updateUndoRedoState();
    } else {
      ElMessage.warning(result.error || '撤销失败');
    }
  } catch (error) {
    ElMessage.error('撤销时发生错误: ' + error.message);
  }
}

async function handleRedo() {
  try {
    const result = await window.electronAPI.redo();
    if (result.success) {
      ElMessage.success('重做成功');
      await loadHosts();
      await updateUndoRedoState();
    } else {
      ElMessage.warning(result.error || '重做失败');
    }
  } catch (error) {
    ElMessage.error('重做时发生错误: ' + error.message);
  }
}

async function refreshHosts() {
  await loadHosts();
  ElMessage.success('刷新成功');
}

async function openHostsFile() {
  try {
    await window.electronAPI.openHostsFile();
  } catch (error) {
    ElMessage.error('打开文件失败: ' + error.message);
  }
}

function handleSearch() {
  // 搜索由计算属性自动处理
}

function handleSelectionChange(selection) {
  selectedHosts.value = selection;
}

function getRowClassName({ row }) {
  return row.isComment ? 'comment-row' : '';
}

function showAddDialog() {
  editingHost.value = null;
  hostForm.ip = '';
  hostForm.domain = '';
  hostForm.comment = '';
  addDialogVisible.value = true;
}

function editHost(host) {
  editingHost.value = host;
  hostForm.ip = host.ip;
  hostForm.domain = host.domain;
  hostForm.comment = host.comment || '';
  addDialogVisible.value = true;
}

async function submitHostForm() {
  if (!hostFormRef.value) return;
  
  try {
    await hostFormRef.value.validate();
    
    if (editingHost.value) {
      const result = await window.electronAPI.updateHost(editingHost.value, {
        ip: hostForm.ip,
        domain: hostForm.domain,
        comment: hostForm.comment
      });
      
      if (result.success) {
        ElMessage.success('修改成功');
        addDialogVisible.value = false;
        await loadHosts();
        await updateUndoRedoState();
      } else {
        ElMessage.error(result.error || '修改失败');
      }
    } else {
      const result = await window.electronAPI.addHost({
        ip: hostForm.ip,
        domain: hostForm.domain,
        comment: hostForm.comment
      });
      
      if (result.success) {
        ElMessage.success('添加成功');
        addDialogVisible.value = false;
        await loadHosts();
        await updateUndoRedoState();
      } else {
        ElMessage.error(result.error || '添加失败');
      }
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  }
}

async function handleCellEdit(row, field) {
  if (row.isComment) return;
  
  const oldHost = { ...row };
  const newHost = { ...row, [field]: row[field] };
  
  const result = await window.electronAPI.updateHost(oldHost, newHost);
  if (result.success) {
    ElMessage.success('修改成功');
    await updateUndoRedoState();
  } else {
    ElMessage.error(result.error || '修改失败');
    await loadHosts();
  }
}

async function deleteHost(host) {
  try {
    const confirmed = await window.electronAPI.confirmDialog({
      type: 'warning',
      title: '确认删除',
      message: `确定要删除 "${host.ip} ${host.domain}" 吗？`,
      detail: '此操作将永久删除该记录，且无法撤销。',
      buttons: ['确认删除', '取消'],
      defaultIndex: 1,
      cancelIndex: 1
    });
    
    if (confirmed === 0) {
      const result = await window.electronAPI.deleteHost(host);
      if (result.success) {
        ElMessage.success('删除成功');
        await loadHosts();
        await updateUndoRedoState();
      } else {
        ElMessage.error(result.error || '删除失败');
      }
    }
  } catch (error) {
    ElMessage.error('删除时发生错误: ' + error.message);
  }
}

function handleBatchDelete() {
  deleteCount.value = selectedHosts.value.length;
  confirmDialogVisible.value = true;
}

async function confirmDelete() {
  try {
    const result = await window.electronAPI.deleteHosts(selectedHosts.value);
    if (result.success) {
      ElMessage.success(`成功删除 ${deleteCount.value} 条记录`);
      confirmDialogVisible.value = false;
      selectedHosts.value = [];
      await loadHosts();
      await updateUndoRedoState();
    } else {
      ElMessage.error(result.error || '删除失败');
    }
  } catch (error) {
    ElMessage.error('批量删除时发生错误: ' + error.message);
  }
}

async function createBackup() {
  try {
    const result = await window.electronAPI.createBackup();
    if (result.success) {
      ElMessage.success('备份创建成功');
      await loadBackups();
    } else {
      ElMessage.error(result.error || '创建备份失败');
    }
  } catch (error) {
    ElMessage.error('创建备份时发生错误: ' + error.message);
  }
}

function handleBackupClick(backup) {
  selectedBackup.value = backup;
}

async function handleRestoreBackup() {
  if (!selectedBackup.value) return;
  
  try {
    const confirmed = await window.electronAPI.confirmDialog({
      type: 'warning',
      title: '确认恢复',
      message: '确定要恢复选中的备份吗？',
      detail: '当前所有的修改将被覆盖，且无法撤销。',
      buttons: ['确认恢复', '取消'],
      defaultIndex: 1,
      cancelIndex: 1
    });
    
    if (confirmed === 0) {
      const result = await window.electronAPI.restoreBackup(selectedBackup.value.path);
      if (result.success) {
        ElMessage.success('备份恢复成功');
        await loadHosts();
        await loadBackups();
        await updateUndoRedoState();
      } else {
        ElMessage.error(result.error || '恢复备份失败');
      }
    }
  } catch (error) {
    ElMessage.error('恢复备份时发生错误: ' + error.message);
  }
}

async function openBackupFolder() {
  if (!selectedBackup.value) return;
  
  let backupDir;
  if (process.env.APPDATA) {
    backupDir = process.env.APPDATA + '\\hosts-manager\\backups';
  } else {
    backupDir = 'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Roaming\\hosts-manager\\backups';
  }
  
  try {
    await window.electronAPI.showFolder(backupDir);
  } catch (error) {
    ElMessage.error('打开文件夹失败: ' + error.message);
  }
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
}

onMounted(async () => {
  await loadHosts();
  await loadBackups();
  await updateUndoRedoState();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  height: 60px;
  line-height: 60px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  color: white;
}

.header-icon {
  font-size: 24px;
  margin-right: 10px;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-actions .el-button.is-disabled {
  opacity: 0.5;
}

.app-main {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.main-card, .backup-card, .info-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.table-footer {
  margin-top: 15px;
  text-align: right;
  color: #909399;
  font-size: 14px;
}

.comment-row {
  background: #fafafa;
}

.comment-text {
  color: #909399;
  font-style: italic;
}

.comment-label {
  color: #909399;
  font-size: 12px;
}

.backup-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.confirm-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.warning-icon {
  font-size: 24px;
  color: #e6a23c;
}

.el-table {
  font-size: 14px;
}

.el-table .cell {
  word-break: break-all;
}

.el-dialog {
  border-radius: 12px;
}

.el-card__header {
  background: #f8f9fa;
  font-weight: 600;
}

.el-collapse-item__header {
  font-weight: 500;
}

.el-collapse-item__content p {
  color: #606266;
  line-height: 1.8;
  padding: 10px 0;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
