Ext.define('DbsPeopleRealConfirmModel',{
	extend: 'Ext.data.Model',
	fields:[
		{name:'checked', type:'boolean'},
		{name:'exception_type', type:'string'},
		{name:'people_name', type:'string'},
		{name:'exception_txt', type:'string'},
		{name:'ceq_show', type:'boolean'},
		{name:'ceq_error', type:'boolean'},
		{name:'rh_show', type:'boolean'},
		{name:'rh_error', type:'boolean'},
		{name:'_error', type:'boolean'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsPeople.RealConfirmPanel',{
	extend:'Ext.panel.Panel',
	
	editDisabled: null,

	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'stretch'
			},
			frame: true,
			items:[ me.initHeaderCfg(), {
				xtype:'grid',
				hidden: true,
				height: 200,
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
						xtype: 'checkcolumn',
						dataIndex: 'checked',
						width: 32,
						listeners: {
							checkchange: function(checkCol, rowIdx) {
								var view = this.down('grid').getView(),
									viewNode = view.getNode(rowIdx),
									record = view.getRecord(viewNode) ;
								if( record.get('_error') ) {
									record.set('checked',false) ;
								}
							},
							scope: this
						}
					},{
						dataIndex: 'people_name',
						text: 'Nom / Prénom',
						width: 150
					},{
						dataIndex: 'exception_type',
						width: 32,
						renderer: function(value,metaData,record) {
							var tdCls = 'op5-spec-dbspeople-realvalidgrid-tdcolor' ;
							tdCls += ' ' ;
							tdCls += 'op5-spec-dbspeople-realvalidgrid-tdcolor-' + value.replace(/[^a-zA-Z0-9]/g, '') ;
							metaData.tdCls += tdCls ;
							return '' ;
						}
					},{
						dataIndex: 'exception_txt',
						text: 'Nature exception',
						flex:1
					}]
					
				},
				store: {
					model: 'DbsPeopleRealConfirmModel',
					data: []
				},
				viewConfig: {
					getRowClass: function(record) {
						if( record.get('_error') ) {
							return 'op5-spec-dbspeople-realvalidgrid-error' ;
						}
						return '' ;
					}
				}
			}],
			buttons:[{
				itemId: 'btnSubmit',
				text: 'Validation',
				handler: function() {
					this.onSubmit() ;
				},
				scope: this
			}]
		});
		
		this.callParent() ;
		
		if( this.data ) {
			this.down('#pHeader').update(this.data) ;
			if( !Ext.isEmpty(this.data.exception_rows) ) {
				this.down('grid').setVisible(true) ;
				this.down('grid').getStore().loadData( this.data.exception_rows ) ;
				
				var disableBtn = false ;
				this.down('grid').getStore().each( function(record) {
					if( this.data.actionDay == 'valid_ceq' && record.get('ceq_error') ) {
						disableBtn = true ;
						record.set('_error',true) ;
					}
					if( this.data.actionDay == 'valid_rh' && record.get('rh_error') ) {
						disableBtn = true ;
						record.set('_error',true) ;
					}
				},this) ;
				if( disableBtn ) {
					this.down('#btnSubmit').setVisible(false) ;
				}
				
				switch( this.data.actionDay ) {
					case 'valid_ceq' :
						this.down('grid').getStore().filter('ceq_show',true) ;
						break ;
					case 'valid_rh' :
						this.down('grid').getStore().filter('rh_show',true) ;
						break ;
				}
			}
		}
	},
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			tpl: [
				'<div class="op5-spec-dbspeople-realvalidhdr">',
					'<div class="op5-spec-dbspeople-realvalidhdr-inline-tbl">',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem op5-spec-dbspeople-realvalidhdr-icon">',
						'</div>',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Date :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{date_sql}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Entrepôt :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{filter_site_txt}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Equipe :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{filter_team_txt}</td>',
							'</tr>',
							'</table>',
						'</div>',
						
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Nb "people" :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{people_count}</td>',
							'</tr>',
							'<tpl if="exception_rows">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Nb exceptions :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue op5-spec-dbspeople-realvalidhdr-exception">{[values.exception_rows.length]}</td>',
							'</tr>',
							'</tpl>',
							'</table>',
						'</div>',
					'</div>',
				'</div>'
			]
		} ;
		
		return headerCfg ;
	},
	onSubmit: function() {
		var allChecked = true ;
		this.down('grid').getStore().each( function(rec) {
			if( !rec.get('checked') ) {
				allChecked = false ;
			}
		}) ;
		if( !allChecked ) {
			Ext.MessageBox.alert('Confirmation','Veuillez valider toutes les exceptions') ;
			return ;
		}
		this.fireEvent('submit',this) ;
	}
}) ;