// 기존 qoolla-student-app `src/components/modal/QuizResponseModal.tsx`를 옮김(import 경로만 이 프로젝트에 맞춤). 실황 수업 퀴즈 답안 모달.
import React, { useRef, useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useMutation } from '@apollo/client/react';
import MathJaxWrapper from '../math/MathJaxWrapper';
import { ADD_LIVE_CLASS_QUIZ_RESPONSE } from '../../api/graphql/mutations';
import { uploadQuizAnswerToStorage } from '../canvas/note-canvas/canvas-utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LiveQuiz {
    quizId: number | string;
    content: string;
}

interface QuizResponseModalProps {
    quiz: LiveQuiz | null;
    appToken: string;
    userId?: string | number;
    onClose: () => void;
    onSubmitted?: () => void;
    onError?: (message: string) => void;
}

const DRAWING_CANVAS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; touch-action: none; -webkit-user-select: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #ffffff; }
    canvas { width: 100%; height: 100%; display: block; background: #ffffff; cursor: crosshair; }
  </style>
</head>
<body>
  <canvas id="paintCanvas"></canvas>
  <script>
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let hasDrawn = false;
    let lastX = 0, lastY = 0;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    window.addEventListener('load', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const touch = (e.touches && e.touches.length > 0) ? e.touches[0] : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : e);
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    function startDraw(e) {
      e.preventDefault();
      isDrawing = true;
      hasDrawn = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }

    function endDraw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      isDrawing = false;
      ctx.closePath();
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw, { passive: false });

    function handleMessage(event) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'CLEAR') {
          const rect = canvas.getBoundingClientRect();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, rect.width, rect.height);
          hasDrawn = false;
        } else if (data.type === 'GET_IMAGE') {
          const dataUrl = canvas.toDataURL('image/png');
          const payload = JSON.stringify({
            type: 'IMAGE_DATA',
            dataUrl: dataUrl,
            hasDrawn: hasDrawn
          });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(payload);
          }
        }
      } catch (err) {
        console.error('Canvas message handling error:', err);
      }
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
  </script>
</body>
</html>
`;

export default function QuizResponseModal({
    quiz,
    appToken,
    userId,
    onClose,
    onSubmitted,
    onError,
}: QuizResponseModalProps) {
    const webViewRef = useRef<WebView>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addQuizResponse] = useMutation(ADD_LIVE_CLASS_QUIZ_RESPONSE);

    useEffect(() => {
        setIsSubmitting(false);
    }, [quiz?.quizId]);

    if (!quiz) return null;

    const handleClear = () => {
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({ type: 'CLEAR' }));
        }
    };

    const handleRequestSubmit = () => {
        if (isSubmitting) return;
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({ type: 'GET_IMAGE' }));
        }
    };

    const handleWebViewMessage = async (event: any) => {
        try {
            const rawData = event.nativeEvent.data;
            const msg = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

            if (msg.type === 'IMAGE_DATA') {
                if (!msg.hasDrawn || !msg.dataUrl) {
                    const warnMsg = '답안을 작성해 주세요.';
                    onError ? onError(warnMsg) : Alert.alert('알림', warnMsg);
                    return;
                }

                setIsSubmitting(true);
                try {
                    const answerUrl = await uploadQuizAnswerToStorage(msg.dataUrl, appToken, quiz.quizId, userId);
                    if (!answerUrl) {
                        throw new Error('답안 이미지 업로드에 실패했습니다.');
                    }

                    await addQuizResponse({
                        variables: {
                            quizId: Number(quiz.quizId),
                            answerUrl,
                        },
                    });

                    onSubmitted?.();
                    onClose();
                } catch (err: any) {
                    console.error('Quiz submit error:', err);
                    const errMsg = err?.message || '답안 제출에 실패했습니다.';
                    onError ? onError(errMsg) : Alert.alert('오류', errMsg);
                } finally {
                    setIsSubmitting(false);
                }
            }
        } catch (e) {
            console.error('Error in onMessage:', e);
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={!!quiz}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Quiz #{quiz.quizId}</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 1. 상단: 퀴즈 수식 및 내용 */}
                    <View style={styles.quizBox}>
                        <MathJaxWrapper
                            statement={quiz.content}
                            fontSize={32}
                            color="#1e293b"
                            fullView={true}
                            autoSize={false}
                            style={styles.mathWrapper}
                        />
                    </View>

                    {/* 2. 하단: Free-draw Canvas */}
                    <View style={styles.canvasContainer}>
                        <WebView
                            ref={webViewRef}
                            originWhitelist={['*']}
                            source={{ html: DRAWING_CANVAS_HTML }}
                            style={styles.webView}
                            scrollEnabled={false}
                            bounces={false}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            onMessage={handleWebViewMessage}
                        />
                    </View>

                    {/* 3. 하단 컨트롤 버튼 바 */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={handleClear}
                            style={styles.clearButton}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.clearButtonText}>지우기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleRequestSubmit}
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <View style={styles.submittingContainer}>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text style={styles.submitButtonText}> 보내는 중...</Text>
                                </View>
                            ) : (
                                <Text style={styles.submitButtonText}>답 보내기</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 900);
const MODAL_HEIGHT = Math.min(SCREEN_HEIGHT * 0.9, 800);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContainer: {
        width: MODAL_WIDTH,
        height: MODAL_HEIGHT,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'column',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ea580c',
    },
    closeButton: {
        padding: 6,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    quizBox: {
        width: '100%',
        maxHeight: 180,
        minHeight: 80,
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 4,
        marginBottom: 12,
        overflow: 'hidden',
    },
    mathWrapper: {
        width: '100%',
        flex: 1,
    },
    canvasContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#cbd5e1',
        overflow: 'hidden',
        marginBottom: 14,
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
    },
    clearButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
    },
    clearButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },
    submitButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#ea580c',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    submittingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
