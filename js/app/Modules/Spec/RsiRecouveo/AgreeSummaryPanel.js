Ext.define('RsiRecouveoAgreeTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: '_phantom',  type: 'boolean'},
		{name: 'agree_file_filerecord_id',  type: 'int'},
		{name: 'agree_file_ref',  type: 'string'},
		{name: 'agree_amount',  type: 'number'},
		{name: 'milestone_fileaction_filerecord_id', type: 'int'},
		{name: 'milestone_status', type: 'string'}, //enum
		{name: 'milestone_date_sched', type: 'date'},
		{name: 'milestone_date_actual', type: 'date'},
		{name: 'milestone_amount', type: 'number'},
		{name: 'linkrecord_filerecord_id', type: 'number'},
		{name: 'linkrecord_id', type: 'string'},
		{name: 'linkrecord_ref', type: 'string'},
		{name: 'linkrecord_amount', type: 'string'},
		{name: 'dummy', type: 'auto'},
	]
}) ;

Ext.define('Optima5.Modules.Spec.RsiRecouveo.AgreeSummaryPanel',{
	extend: 'Ext.panel.Panel',
	
	mixins: [
		'Ext.form.field.Field'
	],
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Détail de l\'écheancier',
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					height: 270,
					xtype: 'treepanel',
					tbar: [{
						itemId: 'tbNew',
						icon: 'images/add.png',
						text: 'Ajout échéance',
						handler: function() {
							this.handleNewMilestone();
						},
						scope: this
					},'-',{
						disabled: true,
						itemId: 'tbDelete',
						icon: 'images/delete.png',
						text: 'Suppr. échéance',
						handler: function() {
							this.handleDeleteMilestone();
						},
						scope: this
					}],
					rootVisible: true,
					store: {
						model: 'RsiRecouveoAgreeTreeModel',
						root: {root:true,children:[],expandable:false},
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					},
					hideHeaders: true,
					columns: [{
						xtype: 'treecolumn',
						width: 64,
						renderer: function(v,m,r) {
							var depth = r.getDepth() ;
							if( depth==0 ) {
								m.tdAttr='style="width:275px;"' ;
								if( Ext.isEmpty(r.childNodes) ) {
									return '<i>'+'Echéancier non paramétré'+'</i>' ;
								} else {
									return '<i>'+'Nouvel échéancier'+'</i>' ;
								}
							}
						}
					},{
						//text: 'Dossier / Echéance / Paiement',
						width: 225,
						renderer: function(v,m,r) {
							var depth = r.getDepth() ;
							if( depth==0 ) {
								m.tdAttr='style="display:none"' ;
							}
							if( depth==1 ) {
								return Ext.util.Format.date(r.get('milestone_date_sched'),'d/m/Y')
							}
							if( depth==2 ) {
								
							}
						},
						dataIndex: 'milestone_date_sched',
						editor: {xtype:'datefield', format: 'Y-m-d', minValue: new Date()}
					},{
						width: 100,
						align: 'right',
						renderer: function(v,m,r) {
							var depth = r.getDepth() ;
							if( depth==0 ) {
								var sum = 0 ;
								Ext.Array.each( r.childNodes, function(chNod) {
									sum += chNod.get('milestone_amount') ;
								}) ;
								return '<b><i>'+Ext.util.Format.number(sum,'0,000.00')+'</i></b>';
							}
							if( depth==1 ) {
								return Ext.util.Format.number(r.get('milestone_amount'),'0,000.00')
							}
							if( depth==2 ) {
								
							}
						},
						dataIndex: 'milestone_amount',
						editor:{ xtype:'numberfield', hideTrigger:true, decimalPrecision:2 }
					}],
					plugins: [{
						ptype: 'rowediting',
						pluginId: 'rowediting',
						listeners: {
							beforeedit: this.onBeforeEditMilestone,
							edit: this.onAfterEditMilestone,
							canceledit: this.onCancelEditMilestone,
							scope: this
						}
					}],
					listeners: {
						selectionchange: function(selModel,records) {
							this.down('treepanel').down('toolbar').down('#tbDelete').setDisabled( !(records && records.length > 0 && (records[0].getDepth()==1)) ) ;
						},
						scope: this
					}
				}]
			},{
				hidden: true,
				xtype: 'fieldset',
				title: 'Gestion écheance',
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					xtype: 'displayfield',
					fieldLabel: 'Action',
					name: 'action_txt',
					value: ''
				},{
					hidden: true,
					xtype: 'displayfield',
					fieldLabel: 'Prévue le',
					name: 'action_sched',
					value: '',
					listeners: {
						change: function(field,val) {
							field.setVisible( !Ext.isEmpty(val) ) ;
						}
					}
				},{
					xtype      : 'fieldcontainer',
					fieldLabel : 'Echéance',
					defaultType: 'radiofield',
					defaults: {
						flex: 1
					},
					layout: 'vbox',
					items: [
						{
							boxLabel  : 'Valider cette échéance<br><i>Identifier le paiement ci-contre</i>',
							name      : 'schedlock_next',
							inputValue: 'confirm'
						}, {
							boxLabel  : 'Reporter l\'échéance',
							name      : 'schedlock_next',
							inputValue: 'resched'
						}, {
							boxLabel  : '<font color="red">Annuler la promesse</font><br><i>Retour dossier "en cours"</i>',
							name      : 'schedlock_next',
							inputValue: 'end'
						}
					]
				},{
					hidden: true,
					anchor: '',
					width: 200,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'schedlock_resched_date',
					fieldLabel: 'Date prévue'
				}]
			}]
		}) ;
		me.mixins.field.constructor.call(me);
		
		me.callParent() ;
	},
	handleNewMilestone: function() {
		if( this.down('treepanel').getPlugin('rowediting')._disabled ) {
			return ;
		}
		var rootNode = this.down('treepanel').getRootNode() ;
		if( !rootNode ) {
			return ;
		}
		var newNode = rootNode.appendChild({
			_phantom: true,
			leaf: true
		}) ;
		this.down('treepanel').getPlugin('rowediting').startEdit(newNode) ;
	},
	handleDeleteMilestone: function() {
		if( this.down('treepanel').getPlugin('rowediting')._disabled ) {
			return ;
		}
		var selNode = this.down('treepanel').getSelectionModel().getSelection()[0] ;
		if( !selNode || (selNode.getDepth()!=1) ) {
			return ;
		}
		this.down('treepanel').getStore().remove(selNode) ;
	},
	onBeforeEditMilestone: function(editor,context) {
		if(editor._disabled){
			return false ;
		}
		if( context.record.getDepth() != 1 ) {
			//console.dir('not milestone') ;
			return false ;
		}
		this.onEditorChange(context.record.getData()) ;
	},
	onAfterEditMilestone: function(editor,context) {
		context.record.set('_phantom',false) ;
		context.record.commit() ;
		this.down('treepanel').getView().refresh() ;
	},
	onCancelEditMilestone: function(editor,context) {
		if( context.record.get('_phantom') ) {
			context.grid.getStore().remove(context.record) ;
		}
	},
	onEditorChange: function(formValues) {
		/*
		var isFilterColumn = this.down('#gridEditorMetafields').headerCt.down('[dataIndex="is_filter"]'),
			isGlobalFilterColumn = this.down('#gridEditorMetafields').headerCt.down('[dataIndex="is_globalfilter"]') ;
		isGlobalFilterColumn.setEditor( ((formValues['is_filter']==true) ? isGlobalFilterColumn.editorTpl : null) ) ;
		if( isGlobalFilterColumn.getEditor().el ) {
			this.down('#gridEditorMetafields').getPlugin('rowediting').getEditor().syncFieldWidth(isGlobalFilterColumn) ; // HACK
		}
		*/
	},
	
	setupFromNew: function( wizardValues ) {
		//console.dir(wizardValues) ;
		switch( wizardValues.agree_period ) {
			case 'MONTH' :
			case 'WEEK' :
				var nb = wizardValues['agree_count'] ;
				var nbcalc = nb ;
				var dateStr = wizardValues['agree_datefirst'] ;
				if( Ext.isNumeric(wizardValues['agree_amountfirst']) && (Number(wizardValues['agree_amountfirst']) > 0) ) {
					wizardValues['agree_amount'] -= wizardValues['agree_amountfirst'] ;
					nbcalc-- ;
					var amount_first = wizardValues['agree_amountfirst'] ;
				}
				var amount_each = Math.round(wizardValues['agree_amount'] * 100 / nbcalc) / 100 ;
				break ;
			case 'SINGLE' :
				var nb = 1 ;
				var dateStr = wizardValues['agree_date'] ;
				var amount_each = Math.round(wizardValues['agree_amount'] * 100 / nbcalc) / 100 ;
				break ;
			default :
				// reset treenode
				this.down('treepanel').setRootNode( {root:true,children:[],expandable:false} ) ;
				return ;
		}
		var dateObj = Ext.Date.parse( dateStr, 'Y-m-d' ) ;
		
		var rootChildren = [] ;
		for( var i=0 ; i<nb ; i++ ) {
			rootChildren.push({
				leaf: true,
				milestone_date_sched: dateObj,
				milestone_amount: ( ((amount_first!=null) && (i==0)) ? Number(amount_first) : Number(amount_each) )
			});
			switch( wizardValues.agree_period ) {
				case 'MONTH' :
					dateObj = Ext.Date.add(dateObj, Ext.Date.MONTH, 1);
					break ;
					
				case 'WEEK' :
					dateObj = Ext.Date.add(dateObj, Ext.Date.DAY, 7);
					break ;
			}
		}
		this.down('treepanel').setRootNode( {root:true,children:rootChildren,expandable:false, expanded:true} ) ;
	},
	setupFromFile: function( fileFilerecordId, fileactionFilerecordId ) {
		
	},
	onLoadFile: function( fileRecord, fileactionFilerecordId ) {
		
		
	},
	
	
	getValue: function() {
		var rootNode = this.down('treepanel').getRootNode() ;
		if( !rootNode ) {
			return null ;
		}
		var recs = [] ;
		var fields = ['milestone_fileaction_filerecord_id','milestone_status','milestone_date_sched','milestone_date_actual','milestone_amount'] ;
		Ext.Array.each( rootNode.childNodes, function(chNod) {
			var tobj = {
				milestone_date_sched: Ext.Date.format(chNod.get('milestone_date_sched'),'Y-m-d'),
				milestone_amount: chNod.get('milestone_amount')
			} ;
			recs.push(tobj) ;
		}) ;
		return recs ;
	}
}) ;
