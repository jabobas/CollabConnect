from flask import Blueprint, jsonify, request
import networkx as nx
from collections import defaultdict
from utils.logger import log_info, log_error

# Blueprint for analytics-related endpoints
analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

# Cache for network data
_network_cache = {
    'data': None,
    'include_isolated': False
}





def _build_collaboration_network(mysql, include_isolated=False):
    """Build collaboration network from database WorkedOn relationships."""
    try:
        log_info(f"Building collaboration network - include_isolated: {include_isolated}")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        
        # Fetch all researchers with their info
        cursor.execute("""
            SELECT p.person_id, p.person_name, p.main_field,
                   d.department_name, i.institution_name,
                   GROUP_CONCAT(p.expertise_1, ',', p.expertise_2, ',', p.expertise_3) as expertise_str
            FROM Person p
            LEFT JOIN WorksIn wi ON p.person_id = wi.person_id
            LEFT JOIN Department d ON wi.department_id = d.department_id
            LEFT JOIN Institution i ON d.institution_id = i.institution_id
            GROUP BY p.person_id, p.person_name, p.main_field, d.department_name, i.institution_name
        """)
        
        people = {}
        for row in cursor.fetchall():
            person_id = row['person_id']
            expertise = []
            if row['expertise_str']:
                expertise = [e.strip() for e in row['expertise_str'].split(',') if e.strip()]
            
            people[person_id] = {
                'id': person_id,
                'label': row['person_name'],
                'institution': row['institution_name'] or 'Unknown',
                'department': row['department_name'] or 'Unknown',
                'expertise': expertise,
                'degree': 0,
                'total_projects': 0
            }
        
        # Fetch all collaborations (WorkedOn relationships)
        cursor.execute("""
            SELECT DISTINCT wo1.person_id as person_1, wo2.person_id as person_2, COUNT(*) as weight
            FROM WorkedOn wo1
            INNER JOIN WorkedOn wo2 ON wo1.project_id = wo2.project_id 
                AND wo1.person_id < wo2.person_id
            GROUP BY wo1.person_id, wo2.person_id
        """)
        
        edges = []
        collaborations = cursor.fetchall()
        
        for collab in collaborations:
            person_1 = collab['person_1']
            person_2 = collab['person_2']
            weight = collab['weight']
            
            if person_1 in people and person_2 in people:
                edges.append({
                    'source': person_1,
                    'target': person_2,
                    'weight': weight
                })
                people[person_1]['degree'] += 1
                people[person_2]['degree'] += 1
        
        # Count projects per person
        cursor.execute("""
            SELECT person_id, COUNT(DISTINCT project_id) as project_count
            FROM WorkedOn
            GROUP BY person_id
        """)
        
        for row in cursor.fetchall():
            if row['person_id'] in people:
                people[row['person_id']]['total_projects'] = row['project_count']
        
        mysql.connection.commit()
        cursor.close()
        
        # Filter isolated nodes if needed
        nodes_list = list(people.values())
        if not include_isolated:
            nodes_list = [n for n in nodes_list if n['degree'] > 0]
        
        # Build graph for community detection
        G = nx.Graph()
        for node in nodes_list:
            G.add_node(node['id'])
        
        for edge in edges:
            G.add_edge(edge['source'], edge['target'], weight=edge['weight'])
        
        # Detect communities using Louvain algorithm
        try:
            from networkx.algorithms import community
            communities_gen = community.greedy_modularity_communities(G)
            community_map = {}
            for comm_id, comm_nodes in enumerate(communities_gen):
                for node_id in comm_nodes:
                    community_map[node_id] = comm_id
        except Exception as e:
            print(f"Community detection failed: {e}, using default communities")
            community_map = {node['id']: 0 for node in nodes_list}
        
        # Add community and size to nodes
        for node in nodes_list:
            node['community'] = community_map.get(node['id'], 0)
            node['size'] = max(50, 50 + (node['degree'] * 15))
        
        # Calculate network statistics
        total_researchers = len(nodes_list)
        total_connections = len(edges)
        avg_collaborators = total_researchers / max(1, total_researchers) if total_researchers > 0 else 0
        
        if total_researchers > 1:
            avg_collaborators = sum(n['degree'] for n in nodes_list) / total_researchers
        
        # Network density calculation
        max_edges = (total_researchers * (total_researchers - 1)) / 2 if total_researchers > 1 else 1
        network_density = total_connections / max_edges if max_edges > 0 else 0
        
        statistics = {
            'total_researchers': total_researchers,
            'total_collaborations': total_connections,
            'avg_collaborators_per_person': round(avg_collaborators, 2),
            'network_density': round(network_density, 4)
        }
        
        log_info(f"Network statistics - researchers: {total_researchers}, collaborations: {total_connections}, density: {statistics['network_density']}")
        return {
            'nodes': nodes_list,
            'edges': edges,
            'statistics': statistics
        }
    
    except Exception as e:
        log_error(f"Error building collaboration network: {str(e)}")
        raise Exception(f"Error building collaboration network: {str(e)}")


@analytics_bp.route('/network', methods=['GET'])
def get_network():
    """Get collaboration network data for visualization."""
    try:
        include_isolated = request.args.get('include_isolated', 'false').lower() == 'true'
        force_rebuild = request.args.get('force_rebuild', 'false').lower() == 'true'
        
        # Check cache
        if not force_rebuild and _network_cache['data'] is not None and _network_cache['include_isolated'] == include_isolated:
            log_info(f"Returning cached collaboration network - include_isolated: {include_isolated}")
            return jsonify({
                'success': True,
                'data': _network_cache['data']
            })
        
        # Build fresh network
        from app import mysql
        log_info("Building fresh collaboration network from database")
        network_data = _build_collaboration_network(mysql, include_isolated)
        
        # Cache the result
        _network_cache['data'] = network_data
        _network_cache['include_isolated'] = include_isolated
        
        log_info(f"Collaboration network built successfully - nodes: {len(network_data['nodes'])}, edges: {len(network_data['edges'])}")
        return jsonify({
            'success': True,
            'data': network_data
        })
    
    except Exception as e:
        import traceback
        log_error(f"Analytics error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
