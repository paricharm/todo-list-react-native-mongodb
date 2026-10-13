
import React, { useMemo, useState } from "react";
import axios from "axios";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import useTasks from "../../hooks/useTasks";
import { useAuth } from "../../context/AuthContext";
import {
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from "../../types/task";

type SortMode = "deadline" | "priority";
type DateField = "scheduledAt" | "deadline";

interface PickerState {
  field: DateField;
  mode: "date" | "time";
  value: Date;
}

function formatDate(value: string | Date): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Could not connect to the server. Check your connection."
    );
  }

  return "Something went wrong. Please try again.";
}

export default function TaskListScreen() {
  const {
    tasks,
    isLoading,
    error,
    refreshTasks,
    addTask,
    updateTask,
    removeTask,
  } = useTasks();

  const { signOut } = useAuth();

  const [sortMode, setSortMode] = useState<SortMode>("deadline");
  const [formVisible, setFormVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [deadline, setDeadline] = useState(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [picker, setPicker] = useState<PickerState | null>(null);

  // Sort by deadline or priority, using deadline as the secondary order.
  const sortedTasks = useMemo(() => {
    const priorityRank: Record<TaskPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    return [...tasks].sort((a, b) => {
      if (sortMode === "priority") {
        const priorityDifference =
          priorityRank[a.priority] - priorityRank[b.priority];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }
      }

      return (
        new Date(a.deadline).getTime() -
        new Date(b.deadline).getTime()
      );
    });
  }, [tasks, sortMode]);

  const selected = selectedTask
    ? tasks.find((task) => task._id === selectedTask._id) ?? selectedTask
    : null;

  const pendingCount = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  // Sign out only after the user confirms.
  function handleSignOut() {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            void signOut().catch(() => {
              Alert.alert(
                "Sign out failed",
                "Could not clear the saved session. Please try again."
              );
            });
          },
        },
      ]
    );
  }

  function openAddForm() {
    const now = new Date();

    setEditingTask(null);
    setTitle("");
    setDescription("");
    setScheduledAt(now);
    setDeadline(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    setPriority("medium");
    setPicker(null);
    setFormVisible(true);
  }

  function openEditForm(task: Task) {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setScheduledAt(new Date(task.scheduledAt));
    setDeadline(new Date(task.deadline));
    setPriority(task.priority);
    setPicker(null);
    setDetailsVisible(false);
    setFormVisible(true);
  }

  function openDetails(task: Task) {
    setSelectedTask(task);
    setDetailsVisible(true);
  }

  function startDatePicker(field: DateField) {
    setPicker({
      field,
      mode: "date",
      value: field === "scheduledAt" ? scheduledAt : deadline,
    });
  }

  function handlePickerChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    const currentPicker = picker;

    if (!currentPicker) {
      return;
    }

    if (event.type !== "set" || !selectedDate) {
      setPicker(null);
      return;
    }

    if (currentPicker.mode === "date") {
      setPicker({
        ...currentPicker,
        mode: "time",
        value: selectedDate,
      });
      return;
    }

    const combinedDate = new Date(currentPicker.value);

    combinedDate.setHours(
      selectedDate.getHours(),
      selectedDate.getMinutes(),
      0,
      0
    );

    if (currentPicker.field === "scheduledAt") {
      setScheduledAt(combinedDate);
    } else {
      setDeadline(combinedDate);
    }

    setPicker(null);
  }

  async function handleSaveTask() {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a task title.");
      return;
    }

    if (
      Number.isNaN(scheduledAt.getTime()) ||
      Number.isNaN(deadline.getTime())
    ) {
      Alert.alert("Invalid date", "Please select valid dates and times.");
      return;
    }

    if (deadline < scheduledAt) {
      Alert.alert(
        "Invalid deadline",
        "The deadline cannot be earlier than the scheduled date and time."
      );
      return;
    }

    const taskInput: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      scheduledAt: scheduledAt.toISOString(),
      deadline: deadline.toISOString(),
      priority,
    };

    try {
      setSaving(true);

      if (editingTask) {
        await updateTask(editingTask._id, taskInput);
      } else {
        await addTask(taskInput);
      }

      setFormVisible(false);
      setEditingTask(null);
    } catch (err: unknown) {
      Alert.alert("Could not save task", apiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    const newStatus: TaskStatus =
      task.status === "completed" ? "pending" : "completed";

    try {
      await updateTask(task._id, { status: newStatus });
    } catch (err: unknown) {
      Alert.alert("Could not update task", apiError(err));
    }
  }

  async function confirmDelete(task: Task) {
    try {
      await removeTask(task._id);
      setDetailsVisible(false);
      setSelectedTask(null);
    } catch (err: unknown) {
      Alert.alert("Could not delete task", apiError(err));
    }
  }

  function askDelete(task: Task) {
    Alert.alert(
      "Delete task?",
      `Are you sure you want to delete "${task.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void confirmDelete(task);
          },
        },
      ]
    );
  }

  function renderPriority(priorityValue: TaskPriority) {
    const priorityStyle =
      priorityValue === "high"
        ? styles.highPriority
        : priorityValue === "low"
          ? styles.lowPriority
          : styles.mediumPriority;

    return (
      <View style={[styles.priorityBadge, priorityStyle]}>
        <Text style={styles.priorityText}>
          {priorityValue.toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>YOUR PERSONAL PLANNER</Text>
          <Text style={styles.heading}>My Tasks</Text>
          <Text style={styles.subtitle}>
            Small steps. Real progress.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.addButton}
            onPress={openAddForm}
          >
            <Text style={styles.addButtonText}>+ Add Task</Text>
          </Pressable>

          <Pressable
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.logoutButtonText}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total tasks</Text>
        </View>
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sectionTitle}>Your list</Text>

        <Pressable
          style={[
            styles.sortButton,
            sortMode === "deadline" && styles.activeSortButton,
          ]}
          onPress={() => setSortMode("deadline")}
        >
          <Text
            style={[
              styles.sortText,
              sortMode === "deadline" && styles.activeSortText,
            ]}
          >
            Deadline
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.sortButton,
            sortMode === "priority" && styles.activeSortButton,
          ]}
          onPress={() => setSortMode("priority")}
        >
          <Text
            style={[
              styles.sortText,
              sortMode === "priority" && styles.activeSortText,
            ]}
          >
            Priority
          </Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refreshTasks()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void refreshTasks()}
          />
        }
      >
        {isLoading && tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.emptyTitle}>Loading your tasks...</Text>
          </View>
        ) : sortedTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>A fresh start!</Text>
            <Text style={styles.emptyMessage}>
              You don't have any tasks yet. Add one to get started.
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={openAddForm}
            >
              <Text style={styles.addButtonText}>
                Create your first task
              </Text>
            </Pressable>
          </View>
        ) : (
          sortedTasks.map((task) => (
            <View key={task._id} style={styles.taskCard}>
              <Pressable
                style={styles.taskMain}
                onPress={() => openDetails(task)}
              >
                <View style={styles.taskTitleRow}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.status === "completed" &&
                        styles.completedTitle,
                    ]}
                  >
                    {task.title}
                  </Text>
                  {renderPriority(task.priority)}
                </View>

                {task.description ? (
                  <Text
                    style={styles.taskDescription}
                    numberOfLines={2}
                  >
                    {task.description}
                  </Text>
                ) : null}

                <Text style={styles.taskDate}>
                  Scheduled: {formatDate(task.scheduledAt)}
                </Text>
                <Text style={styles.taskDate}>
                  Deadline: {formatDate(task.deadline)}
                </Text>

                <Text
                  style={[
                    styles.statusText,
                    task.status === "completed"
                      ? styles.completedStatus
                      : styles.pendingStatus,
                  ]}
                >
                  {task.status === "completed"
                    ? "✓ Completed"
                    : "○ Pending"}
                  {"  ·  Tap for details"}
                </Text>
              </Pressable>

              <View style={styles.cardActions}>
                <Pressable
                  style={styles.smallButton}
                  onPress={() => void toggleTask(task)}
                >
                  <Text style={styles.smallButtonText}>
                    {task.status === "completed"
                      ? "Undo"
                      : "Complete"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.smallButton}
                  onPress={() => openEditForm(task)}
                >
                  <Text style={styles.smallButtonText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.smallButton,
                    styles.deleteButton,
                  ]}
                  onPress={() => askDelete(task)}
                >
                  <Text style={styles.deleteButtonText}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add and edit task form */}
      <Modal
        visible={formVisible}
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingTask ? "Edit task" : "Create a task"}
            </Text>
            <Pressable onPress={() => setFormVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formContent}
          >
            <Text style={styles.label}>Task title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Finish assignment"
              placeholderTextColor="#98A2B3"
              value={title}
              onChangeText={setTitle}
              maxLength={150}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Add a few details..."
              placeholderTextColor="#98A2B3"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              maxLength={2000}
            />

            <Text style={styles.label}>
              Scheduled date and time *
            </Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => startDatePicker("scheduledAt")}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(scheduledAt)}
              </Text>
              <Text style={styles.changeText}>Change</Text>
            </Pressable>

            <Text style={styles.label}>Deadline *</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => startDatePicker("deadline")}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(deadline)}
              </Text>
              <Text style={styles.changeText}>Change</Text>
            </Pressable>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityChoices}>
              {(
                ["low", "medium", "high"] as TaskPriority[]
              ).map((value) => (
                <Pressable
                  key={value}
                  style={[
                    styles.priorityChoice,
                    priority === value &&
                      styles.selectedPriorityChoice,
                  ]}
                  onPress={() => setPriority(value)}
                >
                  <Text
                    style={[
                      styles.priorityChoiceText,
                      priority === value &&
                        styles.selectedPriorityText,
                    ]}
                  >
                    {value.charAt(0).toUpperCase() +
                      value.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              disabled={saving}
              onPress={() => void handleSaveTask()}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingTask ? "Save changes" : "Create task"}
                </Text>
              )}
            </Pressable>
          </ScrollView>

          {picker && (
            <DateTimePicker
              key={`${picker.field}-${picker.mode}`}
              value={picker.value}
              mode={picker.mode}
              display="default"
              onChange={handlePickerChange}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Task details */}
      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Task details</Text>
              <Pressable
                onPress={() => setDetailsVisible(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            {selected && (
              <ScrollView>
                <Text style={styles.detailTaskTitle}>
                  {selected.title}
                </Text>

                {renderPriority(selected.priority)}

                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>
                  {selected.description ||
                    "No description provided."}
                </Text>

                <Text style={styles.detailLabel}>
                  Scheduled date and time
                </Text>
                <Text style={styles.detailValue}>
                  {formatDate(selected.scheduledAt)}
                </Text>

                <Text style={styles.detailLabel}>Deadline</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selected.deadline)}
                </Text>

                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>
                  {selected.status === "completed"
                    ? "Completed"
                    : "Pending"}
                </Text>

                <Pressable
                  style={styles.saveButton}
                  onPress={() => openEditForm(selected)}
                >
                  <Text style={styles.saveButtonText}>
                    Edit task
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => void toggleTask(selected)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {selected.status === "completed"
                      ? "Mark as pending"
                      : "Mark as completed"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.detailDeleteButton}
                  onPress={() => askDelete(selected)}
                >
                  <Text style={styles.deleteButtonText}>
                    Delete task
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    gap: 8,
    alignItems: "flex-end",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#4F46E5",
    marginBottom: 6,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#172033",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 5,
    color: "#667085",
  },
  addButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: "center",
    elevation: 1,
  },
  statNumber: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172033",
  },
  statLabel: {
    fontSize: 11,
    color: "#667085",
    marginTop: 5,
  },
  sortRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: "#172033",
    flex: 1,
  },
  sortButton: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  activeSortButton: {
    backgroundColor: "#E9E8FF",
    borderColor: "#4F46E5",
  },
  sortText: {
    fontSize: 12,
    color: "#667085",
    fontWeight: "600",
  },
  activeSortText: {
    color: "#4338CA",
  },
  errorBox: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#FEF3F2",
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
  },
  retryText: {
    color: "#4338CA",
    fontWeight: "700",
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#EAECF0",
    elevation: 1,
  },
  taskMain: {
    gap: 8,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
  },
  completedTitle: {
    textDecorationLine: "line-through",
    color: "#98A2B3",
  },
  taskDescription: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
  },
  taskDate: {
    fontSize: 12,
    color: "#667085",
    lineHeight: 18,
  },
  priorityBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  highPriority: {
    backgroundColor: "#FEE4E2",
  },
  mediumPriority: {
    backgroundColor: "#FEF0C7",
  },
  lowPriority: {
    backgroundColor: "#D1FADF",
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#344054",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  pendingStatus: {
    color: "#B54708",
  },
  completedStatus: {
    color: "#027A48",
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
    paddingTop: 12,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 9,
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4338CA",
  },
  deleteButton: {
    backgroundColor: "#FEF3F2",
  },
  deleteButtonText: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    marginTop: 25,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E0E7FF",
    color: "#4338CA",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 8,
  },
  emptyMessage: {
    textAlign: "center",
    color: "#667085",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172033",
  },
  closeText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "700",
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D0D5DD",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#172033",
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 100,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  dateButtonText: {
    color: "#344054",
    fontSize: 13,
    flex: 1,
  },
  changeText: {
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: 12,
  },
  priorityChoices: {
    flexDirection: "row",
    gap: 10,
  },
  priorityChoice: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  selectedPriorityChoice: {
    backgroundColor: "#E9E8FF",
    borderColor: "#4F46E5",
  },
  priorityChoiceText: {
    color: "#475467",
    fontWeight: "600",
  },
  selectedPriorityText: {
    color: "#4338CA",
    fontWeight: "800",
  },
  saveButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 25,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  detailsOverlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,40,0.45)",
    justifyContent: "flex-end",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingBottom: 28,
  },
  detailTaskTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172033",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "800",
    color: "#667085",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 6,
  },
  detailValue: {
    color: "#344054",
    fontSize: 15,
    lineHeight: 22,
    marginHorizontal: 20,
  },
  secondaryButton: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#4338CA",
    fontSize: 14,
    fontWeight: "800",
  },
  detailDeleteButton: {
    backgroundColor: "#FEF3F2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
  },
});