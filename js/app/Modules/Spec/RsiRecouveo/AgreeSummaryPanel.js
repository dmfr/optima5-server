Ext.define('RsiRecouveoAgreeTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: '_phantom',  type: 'boolean'},
		{name: 'agree_file_filerecord_id',  type: 'int', allowNull: true},
		{name: 'agree_file_ref',  type: 'string'},
		{name: 'agree_file_is_closed', type: 'boolean'},
		{name: 'agree_amount',  type: 'number'},
		{name: 'milestone_fileaction_filerecord_id', type: 'int'},
		{name: 'milestone_status', type: 'string'}, //enum OK, CUR, null
		{name: 'milestone_date_sched', type: 'date', dateFormat: 'Y-m-d'},
		{name: 'milestone_date_sched_previous', type: 'date', dateFormat: 'Y-m-d', allowNull:true},
		{name: 'milestone_date_actual', type: 'date', dateFormat: 'Y-m-d'},
		{name: 'milestone_amount', type: 'number'},
		{name: 'linkrecord_filerecord_id', type: 'number'},
		{name: 'linkrecord_id', type: 'string'},
		{name: 'linkrecord_ref', type: 'string'},
		{name: 'linkrecord_amount', type: 'number'},
		{name: 'linkrecord_pending', type: 'boolean'},
		{name: 'dummy', type: 'auto'}
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
				flex: 1,
				xtype: 'fieldset',
				layout: 'fit',
				title: (this.altTitle || 'Détail de l\'écheancier'),
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					minHeight: 270,
					xtype: 'treepanel',
					dockedItems: [{
						xtype: 'toolbar',
						hidden: this.readOnly,
						dock: 'top',
						items: [{
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
						}]
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
								} else if( !r.get('agree_file_filerecord_id') ) {
									return '<i>'+'Nouvel échéancier'+'</i>' ;
								} else {
									return '<b>'+r.get('agree_file_ref')+'</b>' ;
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
								if( r.get('milestone_date_sched_previous') 
									&& !Ext.Date.isEqual(r.get('milestone_date_sched_previous') , r.get('milestone_date_sched')) ) {
									
									m.tdStyle+=';color:#0000ff' ;
								}
								return Ext.util.Format.date(r.get('milestone_date_sched'),'d/m/Y')
							}
							if( depth==2 ) {
								if( r.get('linkrecord_pending') ) {
									m.tdStyle+=';color:#ff0000' ;
								}
								if( r.get('linkrecord_ref') ) {
									return r.get('linkrecord_ref') ;
								}
								return r.get('linkrecord_id') ;
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
								v = r.get('milestone_amount') ;
								if( r.get('milestone_status')=='CUR' ) {
									Ext.Array.each( r.childNodes, function(chNode) {
										v += chNode.get('linkrecord_amount') ;
									}) ;
								}
								if( r.get('milestone_status')=='OK' && v==0 ) {
									return 'report.' ;
								}
								if( r.get('milestone_status')=='CANCEL' ) {
									return '&#160;' ;
								}
								return Ext.util.Format.number(v,'0,000.00')
							}
							if( depth==2 ) {
								if( r.parentNode.get('milestone_status')=='OK' ) {
									m.tdStyle+=';font-style: italic' ;
								}
								return Ext.util.Format.number(r.get('linkrecord_amount')*(-1),'0,000.00')
							}
						},
						dataIndex: 'milestone_amount',
						editor:{ xtype:'numberfield', hideTrigger:true, decimalPrecision:2 }
					}],
					plugins: [{
						ptype: 'rowediting',
						pluginId: 'rowediting',
						_disabled: this.readOnly,
						listeners: {
							beforeedit: this.onBeforeEditMilestone,
							edit: this.onAfterEditMilestone,
							canceledit: this.onCancelEditMilestone,
							scope: this
						}
					}],
					listeners: {
						selectionchange: function(selModel,records) {
							while(true) {
								var delEnabled = false ;
								var record ;
								if( records && records.length == 1 ) {
									record = records[0] ;
								} else {
									break ;
								}
								if( record.getDepth() != 1 ) {
									break ;
								}
								if( !Ext.isEmpty(record.get('milestone_status')) ) {
									break ;
								}
								delEnabled = true ;
								break ;
							}
							this.down('treepanel').down('toolbar').down('#tbDelete').setDisabled( !delEnabled ) ;
						},
						scope: this
					},
					viewConfig: {
						getRowClass: function(r) {
							if( (r.getDepth()==1) && (r.get('milestone_status')=='CUR') ) {
								return 'op5-spec-rsiveo-pis' ;
							}
							return '' ;
						},
						plugins: {
							ptype: 'treeviewdragdrop',
							ddGroup: 'RsiRecouveoAgreeRecordsTreeDD',
							dragText: 'Glisser paiements pour associer',
							appendOnly: true,
							enableDrop: true,
							enableDrag: false
						},
						listeners: {
							beforedrop: this.onRecordsTreeDrop,
							scope: this
						}
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
				items: []
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
		rootNode.expand() ;
		this.down('treepanel').getView().refresh() ;
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
		this.down('treepanel').getView().refresh() ;
	},
	onBeforeEditMilestone: function(editor,context) {
		if(editor._disabled){
			return false ;
		}
		if( context.record.getDepth() != 1 ) {
			//console.dir('not milestone') ;
			return false ;
		}
		if( context.record.get('milestone_status') == 'OK' ) {
			return false ;
		}
		this.onEditorChange(context.record.getData()) ;
	},
	onAfterEditMilestone: function(editor,context) {
		context.record.set('_phantom',false) ;
		context.record.commit() ;
		this.down('treepanel').getStore().sort('milestone_date_sched','ASC') ;
		this.down('treepanel').getView().refresh() ;
		
		if( context.record.get('milestone_date_sched_previous') && context.record.get('milestone_status')=='CUR' ) {
			var delta = Ext.Date.diff( context.record.get('milestone_date_sched_previous'), context.record.get('milestone_date_sched'), Ext.Date.DAY ) ;
			
			var msg = '' ;
			msg+= 'Date initiale de l\'échéance : '+Ext.Date.format(context.record.get('milestone_date_sched_previous'),'d/m/Y')+'<br>' ;
			msg+= 'Nouvelle date sélectionnée : '+Ext.Date.format(context.record.get('milestone_date_sched'),'d/m/Y')+'<br>' ;
			msg+= 'Réaligner les dates suivantes ?' ;
			Ext.Msg.confirm('Réaligner écheances ?',msg,function(btn){
				if( btn=='yes') {
					this.applyMilestonesDeltaDays( delta ) ;
				}
			},this) ;
		}
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
	applyMilestonesDeltaDays: function(deltaDays) {
		var rootNode = this.down('treepanel').getRootNode() ;
		Ext.Array.each( rootNode.childNodes, function(chNod) {
			if( chNod.get('milestone_date_sched_previous') && Ext.isEmpty(chNod.get('milestone_status')) ) {
				chNod.set('milestone_date_sched',Ext.Date.add(chNod.get('milestone_date_sched_previous'), Ext.Date.DAY, deltaDays));
				chNod.commit() ;
			}
		}) ;
		this.down('treepanel').getStore().sort('milestone_date_sched','ASC') ;
		this.down('treepanel').getView().refresh() ;
	},
	
	setupFromNew: function( wizardValues ) {
		//console.dir(wizardValues) ;
		switch( wizardValues.agree_period ) {
			case 'MONTH' :
			case 'WEEK' :
				var amount = wizardValues['agree_amount'] ;
				var nb = wizardValues['agree_count'] ;
				var nbcalc = nb ;
				var dateObj = wizardValues['agree_datefirst'] ;
				if( Ext.isNumeric(wizardValues['agree_set_amountfirst']) && (Number(wizardValues['agree_set_amountfirst']) > 0) ) {
					amount -= wizardValues['agree_set_amountfirst'] ;
					nbcalc-- ;
					var amount_first = wizardValues['agree_set_amountfirst'] ;
				}
				if( Ext.isNumeric(wizardValues['agree_set_amountlast']) && (Number(wizardValues['agree_set_amountlast']) > 0) ) {
					amount -= wizardValues['agree_set_amountlast'] ;
					nbcalc-- ;
				}
				var amount_each = Math.round(amount * 100 / nbcalc) / 100 ;
				break ;
			case 'SINGLE' :
				var nb = 1 ;
				var dateObj = wizardValues['agree_date'] ;
				var amount_each = Math.round(wizardValues['agree_amount'] * 100 / nbcalc) / 100 ;
				break ;
			default :
				// reset treenode
				this.down('treepanel').setRootNode( {root:true,children:[],expandable:false, expanded:true} ) ;
				return ;
		}
		
		var sumMilestones = 0 ;
		var rootChildren = [] ;
		for( var i=0 ; i<nb ; i++ ) {
			var milestone_amount ;
			if( ((amount_first!=null) && (i==0)) ) {
				milestone_amount = Number(amount_first) ;
			} else if( i+1 == nb ) {
				milestone_amount = wizardValues['agree_amount'] - sumMilestones ;
			} else {
				milestone_amount = Number(amount_each) ;
			}
			sumMilestones += milestone_amount ;
			rootChildren.push({
				leaf: true,
				milestone_date_sched: dateObj,
				milestone_amount: milestone_amount
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
	setupFromParams: function( fileData, fromParams ) {
		if( !Ext.isArray(fromParams) ) {
			this.down('treepanel').setRootNode( {root:true,children:[],expandable:false, expanded:true} ) ;
			return ;
		}
		var rootChildren = [] ;
		Ext.Array.each( fromParams, function(row) {
			Ext.apply(row,{leaf:true}) ;
			rootChildren.push(row) ;
		}) ;
		var rootObj = {root:true,children:rootChildren,expandable:false, expanded:true} ;
		Ext.apply(rootObj,{
			agree_file_filerecord_id: fileData.file_filerecord_id,
			agree_file_ref: fileData.id_ref
		}) ;
		this.down('treepanel').setRootNode( rootObj ) ;
	},
	setupFromFile: function( fileFilerecordId, fileactionFilerecordId ) {
		if( fileFilerecordId instanceof RsiRecouveoFileTplModel ) {
			this.onLoadFile( fileFilerecordId, fileactionFilerecordId ) ;
		}
	},
	onLoadFile: function( fileRecord, fileactionFilerecordId ) {
		var rootChildren = [] ;
		fileRecord.actions().each( function(fileactionRecord) {
			if( fileactionRecord.get('link_action') != 'AGREE_FOLLOW' ) {
				return ;
			}
			if( Ext.isEmpty(fileactionRecord.get('link_agree')) ) {
				return ;
			}
			var agreeData = fileactionRecord.get('link_agree') ;
			var milestoneStatus = '' ;
			if( fileactionRecord.get('status_is_ok') ) {
				if( agreeData.milestone_cancel ) {
					milestoneStatus = 'CANCEL' ;
				} else {
					milestoneStatus = 'OK' ;
				}
			}
			if( fileactionRecord.getId()==fileactionFilerecordId ) {
				milestoneStatus = 'CUR' ;
			}
			var chNode = {
				leaf: Ext.isEmpty(milestoneStatus),
				expandable: false,
				expanded: !Ext.isEmpty(milestoneStatus),
				children: [],
				
				milestone_fileaction_filerecord_id: fileactionRecord.getId(),
				milestone_date_sched: Ext.Date.format(fileactionRecord.get('date_sched'),'Y-m-d'),
				milestone_date_sched_previous: Ext.Date.format(fileactionRecord.get('date_sched'),'Y-m-d'),
				milestone_date_actual: Ext.Date.format(fileactionRecord.get('date_actual'),'Y-m-d'),
				milestone_amount: agreeData.milestone_amount,
				milestone_status: milestoneStatus
			} ;
			
			if( fileactionRecord.get('status_is_ok') ) {
				Ext.apply(chNode,{
					icon: (milestoneStatus=='CANCEL' ? 'images/op5img/ico_cancel_small.gif' : 'images/modules/rsiveo-ok-16.gif')
				}) ;
			}
			
			if( fileactionRecord.get('status_is_ok') && Ext.isArray(agreeData.linkrecord_arr_recordFilerecordIds) ) {
				var subchNodes = [] ;
				Ext.Array.each( agreeData.linkrecord_arr_recordFilerecordIds, function(recordFilerecordId) {
					fileRecord.records().each( function(iterRecordRecord) {
						if( iterRecordRecord.getId() == recordFilerecordId ) {
							subchNodes.push({
								leaf: true,
								
								linkrecord_filerecord_id: iterRecordRecord.getId(),
								linkrecord_id: iterRecordRecord.get('record_id'),
								linkrecord_ref: iterRecordRecord.get('record_ref'),
								linkrecord_amount: iterRecordRecord.get('amount')
							}) ;
						}
					}) ;
				}) ;
				if( subchNodes.length > 0 ) {
					Ext.apply(chNode, {
						expandable: true,
						expanded: false,
						children: subchNodes
					}) ;
				}
			}
			
			rootChildren.push(chNode) ;
		}) ;
		var rootData = {
			agree_file_filerecord_id: fileRecord.getId(),
			agree_file_ref: fileRecord.get('id_ref'),
			agree_amount: null, // auto calc
			agree_file_is_closed: (fileRecord.get('status_closed_void')||fileRecord.get('status_closed_end'))
		} ;
		this.down('treepanel').setRootNode( Ext.apply({root:true,children:rootChildren,expandable:false, expanded:true},rootData) ) ;
		this.down('treepanel').getStore().sort('milestone_date_sched','ASC') ;
	},
	
	
	onRecordsTreeDrop: function(node, data, overModel, dropPosition, dropHandlers) {
		//console.log('onRecordsTreeDrop') ;
		//console.dir(arguments) ;
		if( overModel.getDepth() != 1 ) {
			return false ;
		}
		if( overModel.get('milestone_status') != 'CUR' ) {
			return false ;
		}
		dropHandlers.wait = true ;
		Ext.Array.each( data.records, function(recordRec) {
			if( !(recordRec instanceof RsiRecouveoRecordTplModel) ) {
				return ;
			}
			overModel.insertChild(0,{
				leaf: true,
				
				linkrecord_filerecord_id: recordRec.getId(),
				linkrecord_id: recordRec.get('record_id'),
				linkrecord_ref: recordRec.get('record_ref'),
				linkrecord_amount: recordRec.get('amount'),
				linkrecord_pending: true
			}) ;
			recordRec.set('amount',0) ;
		}) ;
		this.down('treepanel').getView().refresh() ;
		return true ;
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
				milestone_fileaction_filerecord_id: chNod.get('milestone_fileaction_filerecord_id'),
				milestone_status: chNod.get('milestone_status'),
				milestone_date_sched: Ext.Date.format(chNod.get('milestone_date_sched'),'Y-m-d'),
				milestone_date_sched_previous: (chNod.get('milestone_date_sched_previous') ? Ext.Date.format(chNod.get('milestone_date_sched_previous'),'Y-m-d'):''),
				milestone_amount: chNod.get('milestone_amount')
			} ;
			if( chNod.get('milestone_status')=='CUR' && Ext.isArray(chNod.childNodes) ) {
				var childRecordIds = [] ;
				Ext.Array.each( chNod.childNodes, function(chRecord) {
					childRecordIds.push( chRecord.get('linkrecord_filerecord_id') ) ;
				}) ;
				Ext.apply(tobj,{
					milestone_commit_record_ids: childRecordIds
				}) ;
			}
			recs.push(tobj) ;
		}) ;
		return recs ;
	}
}) ;
