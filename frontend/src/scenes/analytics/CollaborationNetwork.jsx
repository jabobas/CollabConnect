import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  Tooltip,
  IconButton,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

const CollaborationNetwork = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [includeIsolated, setIncludeIsolated] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [allEdges, setAllEdges] = useState([]);

  const fetchNetworkData = useCallback(async (forceRebuild = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:5001/api/analytics/network?include_isolated=${includeIsolated}&force_rebuild=${forceRebuild}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch network data');
      }

      const result = await response.json();

      if (result.success) {
        const { nodes: nodeData, edges: edgeData, statistics: stats } = result.data;

        // Circular layout by community with hub nodes centered
        const communityGroups = {};
        nodeData.forEach(node => {
          const comm = node.community || 0;
          if (!communityGroups[comm]) communityGroups[comm] = [];
          communityGroups[comm].push(node);
        });

        // Sort by degree within each community
        Object.values(communityGroups).forEach(group => {
          group.sort((a, b) => (b.degree || 0) - (a.degree || 0));
        });

        // Layout communities
        const communities = Object.entries(communityGroups);
        const cols = Math.ceil(Math.sqrt(communities.length));
        const layoutNodes = [];
        
        communities.forEach(([commId, nodes], idx) => {
          const commX = (idx % cols) * 400 + 250;
          const commY = Math.floor(idx / cols) * 350 + 250;
          
          nodes.forEach((node, nodeIdx) => {
            if (nodeIdx === 0 && nodes.length > 1) {
              // Hub at center
              layoutNodes.push({ ...node, x: commX, y: commY });
            } else {
              // Others in circle
              const angle = (2 * Math.PI * nodeIdx) / Math.max(nodes.length - 1, 1);
              const radius = 100 + nodeIdx * 8;
              layoutNodes.push({
                ...node,
                x: commX + radius * Math.cos(angle),
                y: commY + radius * Math.sin(angle)
              });
            }
          });
        });

        // Transform nodes for ReactFlow
        const flowNodes = layoutNodes.map((node) => {
          // Color by community
          const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
          ];
          const color = colors[node.community % colors.length];

          return {
            id: node.id.toString(),
            type: 'default',
            position: {
              x: node.x,
              y: node.y,
            },
            data: {
              label: (
                <div style={{ textAlign: 'center', padding: '5px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{node.label}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    {node.institution?.substring(0, 20) || 'N/A'}
                  </div>
                </div>
              ),
              ...node,
            },
            style: {
              background: color,
              color: '#fff',
              border: selectedNode?.id === node.id ? '3px solid #000' : '1px solid #222',
              borderRadius: '8px',
              fontSize: '11px',
              padding: '10px',
              width: Math.max(100, Math.min(node.size * 2, 200)),
              height: 'auto',
            },
          };
        });

        // Transform edges for ReactFlow
        const flowEdges = edgeData.map((edge) => ({
          id: `${edge.source}-${edge.target}`,
          source: edge.source.toString(),
          target: edge.target.toString(),
          animated: false,
          style: {
            stroke: '#888',
            strokeWidth: Math.min(edge.weight * 1.5, 8),
          },
          label: '',
          data: edge,
        }));

        // Create a map of node IDs to node data for easy lookup
        const nodeMap = {};
        layoutNodes.forEach(node => {
          nodeMap[node.id] = node;
        });

        // Store this in state for use in node click handler
        window.__nodeMap = nodeMap;

        setNodes(flowNodes);
        setEdges(flowEdges);
        setAllEdges(flowEdges);
        setStatistics(stats);
        setSelectedNode(null);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [includeIsolated, setNodes, setEdges]);

  useEffect(() => {
    fetchNetworkData();
  }, [includeIsolated, fetchNetworkData]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node.data);
    
    // Highlight edges connected to this node using original edges
    setEdges((eds) =>
      allEdges.map((edge) => {
        const isConnected = edge.source === node.id || edge.target === node.id;
        return {
          ...edge,
          style: {
            stroke: isConnected ? '#FFD700' : '#888',
            strokeWidth: isConnected ? 4 : 1,
            opacity: isConnected ? 1 : 0.15,
          },
          animated: false,
        };
      })
    );
  }, [allEdges]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setEdges(allEdges);
  }, [allEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading && !nodes.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Collaboration Network Visualization
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Controls */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={includeIsolated}
                    onChange={(e) => setIncludeIsolated(e.target.checked)}
                  />
                }
                label="Include Isolated Researchers"
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchNetworkData(true)}
                disabled={loading}
              >
                Refresh
              </Button>
              <Tooltip title="Network shows researchers as nodes and collaborations as edges. Node size represents collaboration activity.">
                <IconButton size="small">
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>

        {/* Statistics */}
        {statistics && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Statistics
                </Typography>
                <Box>
                  <Chip label={`${statistics.total_researchers} Researchers`} sx={{ m: 0.5 }} />
                  <Chip label={`${statistics.total_collaborations} Connections`} sx={{ m: 0.5 }} />
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Avg Collaborators: {statistics.avg_collaborators_per_person}
                </Typography>
                <Typography variant="body2">
                  Network Density: {(statistics.network_density * 100).toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Selected Node Details */}
      {selectedNode && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
            onClick={() => window.location.href = `/person/${selectedNode.id}`}
          >
            {selectedNode.label}
          </Typography>
          <Typography variant="body2">
            {selectedNode.institution} - {selectedNode.department}
          </Typography>
          <Box sx={{ mt: 1 }}>
            {selectedNode.expertise?.map((exp, idx) => (
              <Chip key={idx} label={exp} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Collaborators: {selectedNode.degree} | Projects: {selectedNode.total_projects}
          </Typography>
          
          {/* Show connected researchers */}
          {selectedNode.degree > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Connected To:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {allEdges
                  .filter(edge => edge.source === selectedNode.id.toString() || edge.target === selectedNode.id.toString())
                  .map(edge => {
                    const connectedId = edge.source === selectedNode.id.toString() ? edge.target : edge.source;
                    const nodeMap = window.__nodeMap;
                    const connectedNode = nodeMap && nodeMap[connectedId];
                    return connectedNode ? (
                      <Chip
                        key={connectedId}
                        label={connectedNode.label}
                        onClick={() => window.location.href = `/person/${connectedId}`}
                        sx={{ cursor: 'pointer' }}
                      />
                    ) : null;
                  })}
              </Box>
            </Box>
          )}
          
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => window.location.href = `/person/${selectedNode.id}`}
          >
            View Profile
          </Button>
        </Paper>
      )}

      {/* Network Visualization */}
      <Paper sx={{ height: '700px', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </Paper>
    </Box>
  );
};

export default CollaborationNetwork;
