Ext.define('DbsPeopleRealSummaryModel',{
	extend: 'Ext.data.Model',
	fields:[
		{name:'checked', type:'boolean'},
		{name:'role_code', type:'string'},
		{
			name: 'role_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.role_code ;
				v = Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
				v = v.substr( v.indexOf('-') + 1 ) ;
				return v ;
			}
		},
		{name:'role_sum_duration', type:'number'},
		{name:'role_sum_days', type:'number'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsPeople.RealSummaryPanel',{
	extend:'Ext.panel.Panel',
	
	editDisabled: null,

	initComponent: function() {
		var me = this ;
		var round2_renderer = function(v) {
			return ( Math.round(v*100) / 100 );
		} ;
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'stretch'
			},
			frame: true,
			title: 'Compteurs ETP',
			items:[ me.initHeaderCfg(), {
				xtype:'grid',
				height: 400,
				columns: {
					defaults:{
						menuDisabled: true,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false,
						groupable: false,
						lockable: false
					},
					items:[{
						dataIndex: 'role_code',
						text: 'Code',
						width: 80
					},{
						dataIndex: 'role_txt',
						text: 'Role',
						flex: 1
					},{
						dataIndex: 'role_sum_duration',
						align: 'right',
						text: 'H/hom',
						width: 60,
						renderer: round2_renderer
					},{
						dataIndex: 'role_sum_days',
						align: 'right',
						text: 'J/hom',
						width: 60,
						renderer: round2_renderer
					}]
					
				},
				store: {
					model: 'DbsPeopleRealSummaryModel',
					data: [],
					sorters: [{
						property: 'role_code',
						direction: 'ASC'
					}]
				}
			}]
		});
		
		this.callParent() ;
		
		if( this.data ) {
			this.down('#pHeader').update(this.data) ;
			this.down('grid').getStore().loadData( this.data.summary_rows ) ;
		}
	},
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			tpl: [
				'<div class="op5-spec-dbspeople-realvalidhdr">',
					'<div class="op5-spec-dbspeople-realvalidhdr-inline-tbl">',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem op5-spec-dbspeople-realsummaryhdr-icon">',
						'</div>',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Date :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{date_sql}</td>',
							'</tr>',
							'<tpl if="filter_site_txt">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Entrepôt :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{filter_site_txt}</td>',
							'</tr>',
							'</tpl>',
							'<tpl if="filter_team_txt">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Equipe :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{filter_team_txt}</td>',
							'</tr>',
							'</tpl>',
							'</table>',
						'</div>',
					'</div>',
				'</div>'
			]
		} ;
		
		return headerCfg ;
	}
}) ;